require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ActivityType, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ticketDb = require('./utils/ticket-db');
const ticketLogic = require('./utils/ticket-logic');
const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { parseTime } = require('./utils/timer');
const {
    getUser, addMoney, removeMoney, setCooldown, getCooldowns,
    clearCooldown, removeCooldownByUserId, getAllUsers,
    addReminder, getReminders, removeReminder, removeRemindersByUserId
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
    client.user.setPresence({
        activities: [{ name: 'Baking strawberry cupcakes 🍓🧁', type: ActivityType.Custom }],
        status: 'dnd',
    });

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

    // Initial check and setup timers for all existing reminders
    const reminders = getReminders();
    for (const reminder of reminders) {
        const remaining = reminder.endTime - now;
        if (remaining <= 0) {
            processExpiredReminder(reminder);
        } else {
            setTimeout(() => processExpiredReminder(reminder), remaining);
        }
    }

    // Interval for status updates and safety check
    setInterval(checkCooldowns, 30000);
});

async function processExpiredCooldown(cd) {
    // Check if it still exists in DB to prevent double processing or processing after removal
    const currentCooldowns = getCooldowns();
    const stillExists = currentCooldowns.some(c => c.userId === cd.userId && c.endTime === cd.endTime);
    if (!stillExists) return;

    try {
        const user = await client.users.fetch(cd.userId).catch(() => null);
        const channel = await client.channels.fetch(cd.channelId).catch(() => null);
        if (!user || !channel) {
            clearCooldown(cd.userId, cd.endTime);
            return;
        }

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
            // console.error(`Could not send message to channel ${cd.channelId}`);
        }

        clearCooldown(cd.userId, cd.endTime);
    } catch (error) {
        console.error(`Error processing cooldown for ${cd.userId}:`, error);
        clearCooldown(cd.userId, cd.endTime);
    }
}

async function processExpiredReminder(reminder) {
    // Check if it still exists in DB
    const currentReminders = getReminders();
    const stillExists = currentReminders.some(r => r.id === reminder.id);
    if (!stillExists) return;

    try {
        const targetUser = await client.users.fetch(reminder.userId).catch(() => null);
        const targetChannel = await client.channels.fetch(reminder.channelId).catch(() => null);
        const initiator = await client.users.fetch(reminder.initiatorId).catch(() => null);

        if (!targetUser || !targetChannel) {
            removeReminder(reminder.id);
            return;
        }

        const file = new AttachmentBuilder('./assets/reminder.png');
        const remindEmbed = new EmbedBuilder()
            .setColor('#ff85a2')
            .setTitle('🔔 Ding-dong! Reminder! 🎀')
            .setThumbnail('attachment://reminder.png')
            .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\n${reminder.message} ✨\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
            .setFooter({ text: `Lovingly set by ${initiator ? initiator.tag : 'someone'} 🌸` })
            .setTimestamp();

        // Send DM
        try {
            await targetUser.send({ embeds: [remindEmbed], files: [file] });
        } catch (error) {
            // console.error(`Could not send DM to ${targetUser.tag}.`);
        }

        // Ping in channel
        try {
            await targetChannel.send({ content: `${targetUser}`, embeds: [remindEmbed], files: [file] });
        } catch (error) {
            // console.error(`Could not send message to channel ${targetChannel.id}.`);
        }

        removeReminder(reminder.id);
    } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        removeReminder(reminder.id);
    }
}

async function checkCooldowns() {
    const now = Date.now();
    const cooldowns = getCooldowns();

    if (cooldowns.length > 0) {
        // Find the soonest expiration to process if missed
        const soonest = cooldowns.reduce((prev, curr) => (prev.endTime < curr.endTime) ? prev : curr);
        const remainingMs = soonest.endTime - now;

        if (remainingMs <= 0) {
            // Process any that missed their timer
            processExpiredCooldown(soonest);
        }
    }
}

client.on('interactionCreate', async interaction => {
    try {

        if (interaction.commandName === 'remind') {
            const timeStr = interaction.options.getString('time');
            const message = interaction.options.getString('message');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
            const targetUser = interaction.options.getUser('user') || interaction.user;

            const durationMs = parseTime(timeStr);

            if (!durationMs) {
                return interaction.reply({ content: 'Oh no! I couldn\'t understand that time format. Please use something like "10m" or "2h"! 🌸', ephemeral: true });
            }

            const endTime = Date.now() + durationMs;
            const reminderId = addReminder(targetUser.id, targetChannel.id, message, endTime, interaction.user.id);
            const reminderData = { id: reminderId, userId: targetUser.id, channelId: targetChannel.id, message, endTime, initiatorId: interaction.user.id };

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

            setTimeout(() => processExpiredReminder(reminderData), durationMs);
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
            removeRemindersByUserId(targetUser.id);

            const file = new AttachmentBuilder('./assets/cooldown.png');
            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle('☀️ Nap Time Over! ✨')
                .setThumbnail('attachment://cooldown.png')
                .setDescription(`─── ⋅ ʚ ♡ ɞ ⋅ ───\n\nYay! Successfully removed cooldowns and reminders for ${targetUser}! \nThey are now wide awake and ready for tasks! ✨🌸\n\n─── ⋅ ʚ ♡ ɞ ⋅ ───`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], files: [file] });
        }

        // --- Ticket System Integration ---
        
        // Slash Commands for Tickets
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'setup') {
                const adminRole = interaction.options.getRole('admin_role');
                const logChannel = interaction.options.getChannel('log_channel');
                const transcriptChannel = interaction.options.getChannel('transcript_channel');

                ticketDb.setGuildConfig(interaction.guildId, {
                    adminRoleId: adminRole.id,
                    logChannelId: logChannel.id,
                    transcriptChannelId: transcriptChannel.id
                });

                return await interaction.reply({
                    content: `✅ **Ticket System Configured!**\n\n- **Admin Role:** ${adminRole}\n- **Logs:** ${logChannel}\n- **Transcripts:** ${transcriptChannel}\n\nNow use \`/category create\` to define your departments! ✨`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === 'panel') {
                const sub = interaction.options.getSubcommand();
                if (sub === 'create') {
                    const title = interaction.options.getString('title');
                    const description = interaction.options.getString('description');
                    const channel = interaction.options.getChannel('channel') || interaction.channel;

                    const categories = ticketDb.getCategories(interaction.guildId);
                    if (categories.length === 0) {
                        return interaction.reply({ content: 'You must first create at least one category using `/category create`!', ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#ff85a2')
                        .setTitle(title)
                        .setDescription(description)
                        .setTimestamp();

                    const rows = [];
                    let currentRow = new ActionRowBuilder();

                    categories.forEach((cat, i) => {
                        if (i > 0 && i % 5 === 0) {
                            rows.push(currentRow);
                            currentRow = new ActionRowBuilder();
                        }
                        currentRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`ticket_open_${cat.id}`)
                                .setLabel(cat.name)
                                .setEmoji(cat.emoji)
                                .setStyle(ButtonStyle.Primary)
                        );
                    });
                    rows.push(currentRow);

                    await channel.send({ embeds: [embed], components: rows });
                    return await interaction.reply({ content: `Panel successfully created in ${channel}! ✨`, ephemeral: true });
                }
            }

            if (interaction.commandName === 'category') {
                const sub = interaction.options.getSubcommand();
                if (sub === 'create') {
                    const name = interaction.options.getString('name');
                    const emoji = interaction.options.getString('emoji');
                    const category = interaction.options.getChannel('category');
                    const role = interaction.options.getRole('support_role');

                    const id = Math.random().toString(36).substring(2, 9);

                    ticketDb.createCategory({
                        id: id,
                        guildId: interaction.guildId,
                        name: name,
                        emoji: emoji,
                        roles: [role.id],
                        categoryId: category.id,
                        maxTickets: 1,
                        questions: []
                    });

                    return await interaction.reply({
                        content: `✅ Created category **${name}** ${emoji}!\nNext step: Run \`/panel create\` to show it to users! ✨`,
                        ephemeral: true
                    });
                } else if (sub === 'list') {
                    const categories = ticketDb.getCategories(interaction.guildId);
                    if (categories.length === 0) {
                        return interaction.reply({ content: 'No ticket categories found! 🌷', ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#ffc8dd')
                        .setTitle('📋 Ticket Categories 🌸')
                        .setDescription(categories.map(c => `**${c.name}** ${c.emoji} — ID: \`${c.id}\``).join('\n'))
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else if (sub === 'delete') {
                    const id = interaction.options.getString('id');
                    const category = ticketDb.getCategory(id);
                    if (!category || category.guildId !== interaction.guildId) {
                        return interaction.reply({ content: 'I couldn\'t find that category ID! 🍭', ephemeral: true });
                    }

                    ticketDb.deleteCategory(id);
                    return interaction.reply({ content: `✅ Successfully deleted the **${category.name}** category! 🗑️✨`, ephemeral: true });
                }
            }

            if (interaction.commandName === 'close') {
                return await ticketLogic.closeTicket(interaction);
            }
        }

        // Ticket Panel Button Click
        if (interaction.isButton() && interaction.customId.startsWith('ticket_open_')) {
            const categoryId = interaction.customId.replace('ticket_open_', '');
            const category = ticketDb.getCategory(categoryId);
            if (!category) return interaction.reply({ content: 'Invalid category!', ephemeral: true });

            if (ticketDb.isBlacklisted(interaction.guildId, interaction.user.id)) {
                return interaction.reply({ content: 'You are blacklisted from opening tickets.', ephemeral: true });
            }

            const active = ticketDb.getUserActiveTickets(interaction.user.id, interaction.guildId);
            if (active.length >= category.maxTickets) {
                return interaction.reply({ content: `You already have ${active.length} open ticket(s) in this category.`, ephemeral: true });
            }

            const questions = JSON.parse(category.questions || '[]');
            if (questions.length > 0) {
                const modal = new ModalBuilder()
                    .setCustomId(`ticket_modal_${categoryId}`)
                    .setTitle(`${category.name} Information`);

                questions.forEach((q, i) => {
                    const input = new TextInputBuilder()
                        .setCustomId(`question_${i}`)
                        .setLabel(q.label)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                });

                return await interaction.showModal(modal);
            }

            return await ticketLogic.createTicket(interaction, category, {});
        }

        // Modal Submission
        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
            const categoryId = interaction.customId.replace('ticket_modal_', '');
            const category = ticketDb.getCategory(categoryId);
            const questions = JSON.parse(category.questions || '[]');
            
            const answers = {};
            questions.forEach((q, i) => {
                answers[q.label] = interaction.fields.getTextInputValue(`question_${i}`);
            });

            return await ticketLogic.createTicket(interaction, category, answers);
        }

        // Management Buttons
        if (interaction.isButton()) {
            const ticket = ticketDb.getTicket(interaction.channelId);
            if (!ticket) return;

            switch (interaction.customId) {
                case 'ticket_close_prompt':
                    await ticketLogic.closePrompt(interaction);
                    break;
                case 'ticket_close_confirm':
                    await ticketLogic.closeTicket(interaction);
                    break;
                case 'ticket_claim':
                    await ticketLogic.claimTicket(interaction);
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        
        let errorMessage = 'Oh no! Something went a little wobbly while doing that! 🧊💦';
        // If it's an admin, show a slightly more detailed error for debugging
        if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            errorMessage += `\n\n**Admin Debug Info:** \`${error.message}\``;
        }

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
