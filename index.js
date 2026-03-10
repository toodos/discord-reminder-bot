require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ActivityType } = require('discord.js');
const { parseTime } = require('./utils/timer');
const { getUser, addMoney, removeMoney, setCooldown, getCooldowns, clearCooldown, removeCooldownByUserId, getAllUsers } = require('./utils/database');

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
    client.user.setActivity('Recording videos for OnlyFans', { type: ActivityType.Custom });

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
            await user.send("you can be assigned the task now");
        } catch (e) {
            console.error(`Could not DM user ${cd.userId}`);
        }

        // Channel Ping
        try {
            const mention = initiator ? `${user} and ${initiator}` : `${user}`;
            await channel.send(`${mention}, you can be assigned the task now`);
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
            client.user.setActivity(`Cooldown: ${hours}h ${minutes}m left`, { type: ActivityType.Custom });
        } else {
            client.user.setActivity('Recording videos for OnlyFans', { type: ActivityType.Custom });
            // Process any that missed their timer
            processExpiredCooldown(soonest);
        }
    } else {
        client.user.setActivity('Recording videos for OnlyFans', { type: ActivityType.Custom });
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
                    content: `You are on cooldown! You cannot assign me any new tasks until **<t:${Math.floor(existing.endTime / 1000)}:R>**.`,
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
                return interaction.reply({ content: 'Invalid time format! Please use something like "10m" or "2h".', ephemeral: true });
            }

            await interaction.reply({ content: `Reminder set for ${timeStr} for ${targetUser.tag}: "${message}"`, ephemeral: true });

            setTimeout(async () => {
                // Send DM
                try {
                    await targetUser.send(`Reminder from ${interaction.user.tag}: ${message}`);
                } catch (error) {
                    console.error(`Could not send DM to ${targetUser.tag}.`);
                }

                // Ping in channel/ticket
                try {
                    if (targetUser.id === interaction.user.id) {
                        await targetChannel.send(`${targetUser}, here is your reminder: ${message}`);
                    } else {
                        await targetChannel.send(`Reminder for ${targetUser.tag}: ${message}`);
                    }
                } catch (error) {
                    console.error(`Could not send message to channel ${targetChannel.id}.`);
                }
            }, durationMs);
        } else if (interaction.commandName === 'add_money') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Only Administrators can use this command!', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getNumber('amount');

            if (amount < 0) {
                return interaction.reply({ content: 'You cannot add a negative amount of money!', ephemeral: true });
            }

            const newBalance = addMoney(targetUser.id, amount);
            await interaction.reply({ content: `Added **₹${amount}** to ${targetUser.tag}'s balance. New balance: **₹${newBalance}**` });

        } else if (interaction.commandName === 'balance') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userData = getUser(targetUser.id);
            const allUsersData = getAllUsers();

            // Create leaderboard array and sort by balance
            const sortedUsers = Object.entries(allUsersData)
                .map(([userId, data]) => ({ userId, balance: data.balance }))
                .sort((a, b) => b.balance - a.balance);

            const leaderboard = sortedUsers.slice(0, 3);
            const userRank = sortedUsers.findIndex(u => u.userId === targetUser.id) + 1;

            const trophies = ['🥇', '🥈', '🥉'];
            let leaderboardStr = "**🏆 Economy Leaderboard (Top 3)**\n";
            leaderboard.forEach((entry, index) => {
                leaderboardStr += `${trophies[index]} <@${entry.userId}>: **₹${entry.balance}**\n`;
            });

            if (userRank > 3) {
                leaderboardStr += `\n**Your Position: #${userRank}**`;
            }

            const replyMsg = `${targetUser.tag}'s current balance is **₹${userData.balance}**.\n\n${leaderboardStr}`;
            await interaction.reply({ content: replyMsg });
        } else if (interaction.commandName === 'remove_money') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Only Administrators can use this command!', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getNumber('amount');

            if (amount < 0) {
                return interaction.reply({ content: 'You cannot remove a negative amount of money!', ephemeral: true });
            }

            const newBalance = removeMoney(targetUser.id, amount);
            await interaction.reply({ content: `Removed **₹${amount}** from ${targetUser.tag}'s balance. New balance: **₹${newBalance}**` });
        } else if (interaction.commandName === 'cd') {
            const targetUser = interaction.options.getUser('user');
            const timeStr = interaction.options.getString('time') || '24h';

            // Check for existing cooldown
            const existing = getCooldowns().find(c => c.userId === targetUser.id);
            if (existing) {
                return interaction.reply({
                    content: `${targetUser.tag} is already on cooldown! It expires **<t:${Math.floor(existing.endTime / 1000)}:R>**.`,
                    ephemeral: true
                });
            }

            const duration = parseTime(timeStr);
            if (!duration) {
                return interaction.reply({ content: 'Invalid time format! Please use something like "1h", "12h", or "1d".', ephemeral: true });
            }

            const endTime = Date.now() + duration;
            const cooldownData = { userId: targetUser.id, channelId: interaction.channelId, endTime, initiatorId: interaction.user.id };

            setCooldown(targetUser.id, interaction.channelId, endTime, interaction.user.id);

            // Set immediate timer for this interaction sesssion
            setTimeout(() => processExpiredCooldown(cooldownData), duration);

            await interaction.reply({ content: `Cooldown set for ${targetUser.tag}. you will be assigned task after **<t:${Math.floor(endTime / 1000)}:R>**. Both you and they will be notified when it ends.` });
        } else if (interaction.commandName === 'remove_cd') {
            const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                return interaction.reply({ content: 'Only Administrators can use this command!', ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            removeCooldownByUserId(targetUser.id);

            await interaction.reply({ content: `Successfully removed all active cooldowns for ${targetUser.tag}.` });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
