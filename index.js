require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ActivityType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { parseTime } = require('./utils/timer');
const {
    getUser, addMoney, removeMoney, setCooldown, getCooldowns,
    clearCooldown, removeCooldownByUserId, getAllUsers
} = require('./utils/database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Baking strawberry cupcakes 🍓🧁', { type: ActivityType.Custom });

    // Initial check and setup timers for all existing cooldowns
    const cooldowns = getCooldowns();
    const now = Date.now();
    for (const cd of cooldowns) {
        const remaining = cd.endTime - now;
        if (remaining <= 0) {
            processExpiredCooldown(cd);
        } else {
            setTimeout(() => processExpiredCooldown(cd), remaining);
        }
    }

    // Interval for status updates and safety check
    setInterval(checkCooldowns, 30000);
});

async function processExpiredCooldown(cd) {
    // Check if it still exists in DB to prevent double processing
    const currentCooldowns = getCooldowns();
    const stillExists = currentCooldowns.some(c => c.userId === cd.userId && c.endTime === cd.endTime);
    if (!stillExists) return;

    try {
        const user = await client.users.fetch(cd.userId);
        const channel = await client.channels.fetch(cd.channelId);
        let initiator;
        if (cd.initiatorId) {
            try {
                initiator = await client.users.fetch(cd.initiatorId);
            } catch (e) {
                console.error(`Could not fetch initiator ${cd.initiatorId}`);
            }
        }

        // DM to target user
        try {
            const file = new AttachmentBuilder('./assets/cooldown.png');
            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle('🌸 Cooldown Expired! ✨')
                .setThumbnail('attachment://cooldown.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nYay! You can be assigned the task now! ✨🌸\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .setTimestamp();
            await user.send({ embeds: [embed], files: [file] });
        } catch (e) {
            console.error(`Could not DM user ${cd.userId}`);
        }

        // Channel Ping
        try {
            const file = new AttachmentBuilder('./assets/cooldown.png');
            const mention = initiator ? `${user} and ${initiator}` : `${user}`;
            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle('🎀 Cooldown Expired! 🌷')
                .setThumbnail('attachment://cooldown.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nPaging ${mention}!\nYou can be assigned the task now! 🎀🌷\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .setTimestamp();
            await channel.send({ content: `${mention}`, embeds: [embed], files: [file] });
        } catch (e) {
            console.error(`Could not send message to channel ${cd.channelId}`);
        }

        clearCooldown(cd.userId, cd.endTime);
    } catch (error) {
        console.error(`Error processing cooldown for ${cd.userId}:`, error);
        clearCooldown(cd.userId, cd.endTime);
    }
}

async function checkCooldowns() {
    const now = Date.now();
    const cooldowns = getCooldowns();

    if (cooldowns.length > 0) {
        // Find the soonest expiration to show in status
        const soonest = cooldowns.reduce((prev, curr) => (prev.endTime < curr.endTime) ? prev : curr);
        const remainingMs = soonest.endTime - now;

        if (remainingMs > 0) {
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            client.user.setActivity(`Counting down: ${hours}h ${minutes}m left... ⏳🍭`, { type: ActivityType.Custom });
        } else {
            client.user.setActivity('Baking strawberry cupcakes 🍓🧁', { type: ActivityType.Custom });
            // Process any that missed their timer
            processExpiredCooldown(soonest);
        }
    } else {
        client.user.setActivity('Baking strawberry cupcakes 🍓🧁', { type: ActivityType.Custom });
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        // Global Cooldown Block
        if (interaction.commandName !== 'balance') {
            const existing = getCooldowns().find(c => c.userId === interaction.user.id);
            if (existing) {
                return interaction.reply({
                    content: `Wait a second! ✨ You're taking a tiny break! You can assign me a new task in **<t:${Math.floor(existing.endTime / 1000)}:R>**. 🎀`,
                    ephemeral: true
                });
            }
        }

        if (interaction.commandName === 'remind') {
            const timeStr = interaction.options.getString('time');
            const message = interaction.options.getString('message');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
            const targetUser = interaction.options.getUser('user') || interaction.user;

            const durationMs = parseTime(timeStr);

            if (!durationMs) {
                return interaction.reply({ content: 'Oh no! I couldn\'t understand that time format. Please use something like "10m" or "2h"! 🌸', ephemeral: true });
            }

            const file = new AttachmentBuilder('./assets/reminder.png');
            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle('⏰ Reminder Set! ✨')
                .setThumbnail('attachment://reminder.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nI'll make sure to remind ${targetUser} about: \n> ${message} 🎀\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .addFields(
                    { name: '✨ Time', value: `\`${timeStr}\``, inline: true },
                    { name: '🌷 Channel', value: `${targetChannel}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], files: [file], ephemeral: true });

            setTimeout(async () => {
                const file = new AttachmentBuilder('./assets/reminder.png');
                const remindEmbed = new EmbedBuilder()
                    .setColor('#ff85a2')
                    .setTitle('🔔 Ding-dong! Reminder! 🎀')
                    .setThumbnail('attachment://reminder.png')
                    .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\n${message} ✨\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                    .setFooter({ text: `Lovingly set by ${interaction.user.tag} 🌸` })
                    .setTimestamp();

                // Send DM
                try {
                    await targetUser.send({ embeds: [remindEmbed], files: [file] });
                } catch (error) {
                    console.error(`Could not send DM to ${targetUser.tag}.`);
                }

                // Ping in channel
                try {
                    await targetChannel.send({ content: `${targetUser}`, embeds: [remindEmbed], files: [file] });
                } catch (error) {
                    console.error(`Could not send message to channel ${targetChannel.id}.`);
                }
            }, durationMs);
        } else if (interaction.commandName === 'add_money') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Oopsie! Only big-boss Administrators can use this command! 🎀', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getNumber('amount');

            if (amount < 0) {
                return interaction.reply({ content: 'You can\'t add a negative amount of money, silly! 🍭', ephemeral: true });
            }

            const newBalance = addMoney(targetUser.id, amount);
            const file = new AttachmentBuilder('./assets/money.png');
            const embed = new EmbedBuilder()
                .setColor('#ffc8dd')
                .setTitle('💰 Yay! Money Added! ✨')
                .setThumbnail('attachment://money.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nSuccessfully added **₹${amount}** to ${targetUser}'s sparkly balance! 🍬\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .addFields({ name: '✨ New Balance', value: `**₹${newBalance}**` });

            await interaction.reply({ embeds: [embed], files: [file] });

        } else if (interaction.commandName === 'balance') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userData = getUser(targetUser.id);
            const allUsersData = getAllUsers();

            const sortedUsers = Object.entries(allUsersData)
                .map(([userId, data]) => ({ userId, balance: data.balance }))
                .sort((a, b) => b.balance - a.balance);

            const leaderboard = sortedUsers.slice(0, 3);
            const userRank = sortedUsers.findIndex(u => u.userId === targetUser.id) + 1;

            const trophies = ['🥇', '🥈', '🥉'];
            let leaderboardStr = "";
            leaderboard.forEach((entry, index) => {
                leaderboardStr += `${trophies[index]} <@${entry.userId}>: **₹${entry.balance}**\n`;
            });

            if (userRank > 3) {
                leaderboardStr += `\n...You are at **#${userRank}**`;
            }

            const file = new AttachmentBuilder('./assets/balance.png');
            const embed = new EmbedBuilder()
                .setColor('#ffb7ff')
                .setAuthor({
                    name: `${targetUser.username}'s Sparkly Vault 💎`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail('attachment://balance.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nChecking the vault floors... 🩰✨\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .addFields(
                    { name: '💰 Current Wealth', value: `\`₹${userData.balance.toLocaleString()}\` 🌸`, inline: true },
                    { name: '📊 Global Rank', value: `\`#${userRank}\` ✨`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: false }, // Spacer
                    { name: '🏆 Top Ballers (Global) 🍭', value: leaderboardStr || "*No records found yet!*", inline: false }
                )
                .setFooter({ text: 'Economy System Cute v2.0 🎀', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], files: [file] });
        } else if (interaction.commandName === 'remove_money') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Oopsie! Only big-boss Administrators can do that! 🎀', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getNumber('amount');

            if (amount < 0) {
                return interaction.reply({ content: 'You can\'t remove a negative amount! That\'s just silly. 🍭', ephemeral: true });
            }

            const newBalance = removeMoney(targetUser.id, amount);
            const file = new AttachmentBuilder('./assets/money.png');
            const embed = new EmbedBuilder()
                .setColor('#c3aed6')
                .setTitle('💸 Balance Deducted 🌷')
                .setThumbnail('attachment://money.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nRemoved **₹${amount}** from ${targetUser}'s account. 🍬\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .addFields({ name: '✨ Remaining Balance', value: `**₹${newBalance}**` });

            await interaction.reply({ embeds: [embed], files: [file] });
        } else if (interaction.commandName === 'cd') {
            const targetUser = interaction.options.getUser('user');
            const timeStr = interaction.options.getString('time') || '24h';

            const existing = getCooldowns().find(c => c.userId === targetUser.id);
            if (existing) {
                return interaction.reply({
                    content: `Wait a sec! ✨ ${targetUser.tag} is already having a cozy nap! It expires **<t:${Math.floor(existing.endTime / 1000)}:R>**. 🌙`,
                    ephemeral: true
                });
            }

            const duration = parseTime(timeStr);
            if (!duration) {
                return interaction.reply({ content: 'Oh no! I didn\'t understand that time format. Try "24h" or "1d"! 🌸', ephemeral: true });
            }

            const endTime = Date.now() + duration;
            const cooldownData = { userId: targetUser.id, channelId: interaction.channelId, endTime, initiatorId: interaction.user.id };

            setCooldown(targetUser.id, interaction.channelId, endTime, interaction.user.id);
            setTimeout(() => processExpiredCooldown(cooldownData), duration);

            const file = new AttachmentBuilder('./assets/cooldown.png');
            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle('🌸 Chill Time! ✨')
                .setAuthor({ name: 'Cooldown Corner 🎀', iconURL: 'https://cdn-icons-png.flaticon.com/512/3468/3468411.png' })
                .setThumbnail('attachment://cooldown.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nThe following user is taking a li'l nap. You can receive next task after the cool down ends!\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .addFields(
                    { name: '✨ Resty Person', value: `${targetUser}`, inline: true },
                    { name: '⏳ Wait Time', value: `\`${timeStr}\``, inline: true },
                    { name: '🌙 Alarm Set For', value: `<t:${Math.floor(endTime / 1000)}:f> (<t:${Math.floor(endTime / 1000)}:R>)`, inline: false },
                    { name: '🍭 Started By', value: `${interaction.user}`, inline: true }
                )
                .setFooter({ text: 'Status: Counting down the sleepy time...' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], files: [file] });
        } else if (interaction.commandName === 'remove_cd') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Oopsie! Only big-boss Administrators can do that! 🎀', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            removeCooldownByUserId(targetUser.id);

            await interaction.reply({ content: `Yay! Successfully removed cooldowns for ${targetUser.tag}! ✨🌸` });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Oh no! Something went a little wobbly while doing that! 🧊💦', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Oh no! Something went a little wobbly while doing that! 🧊💦', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
