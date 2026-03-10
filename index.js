require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ActivityType } = require('discord.js');
const { parseTime } = require('./utils/timer');
const { getUser, addMoney, removeMoney, setCooldown, getCooldowns, clearCooldown } = require('./utils/database');

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

    // Check for expired cooldowns every minute
    setInterval(checkCooldowns, 60000);
    checkCooldowns(); // Run once on startup
});

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
        }
    } else {
        client.user.setActivity('Recording videos for OnlyFans', { type: ActivityType.Custom });
    }

    for (const cd of cooldowns) {
        if (now >= cd.endTime) {
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
                    await user.send("Your cooldown is over!");
                } catch (e) {
                    console.error(`Could not DM user ${cd.userId}`);
                }

                // Channel Ping
                try {
                    const mention = initiator ? `${user} and ${initiator}` : `${user}`;
                    await channel.send(`${mention}, the cooldown is over!`);
                } catch (e) {
                    console.error(`Could not send message to channel ${cd.channelId}`);
                }

                clearCooldown(cd.userId, cd.endTime);
            } catch (error) {
                console.error(`Error processing cooldown for ${cd.userId}:`, error);
                clearCooldown(cd.userId, cd.endTime);
            }
        }
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

            await interaction.reply({ content: `${targetUser.tag}'s current balance is **₹${userData.balance}**.` });
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

            setCooldown(targetUser.id, interaction.channelId, endTime, interaction.user.id);

            await interaction.reply({ content: `Cooldown set for ${targetUser.tag}. Expires **<t:${Math.floor(endTime / 1000)}:R>**. Both you and they will be notified when it ends.` });
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
