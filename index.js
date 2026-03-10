require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ActivityType } = require('discord.js');
const { parseTime } = require('./utils/timer');
const { getUser, addMoney, removeMoney } = require('./utils/database');

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
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
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
