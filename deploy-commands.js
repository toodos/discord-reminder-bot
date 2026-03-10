require('dotenv').config();
const { REST, Routes, PermissionFlagsBits } = require('discord.js');

const commands = [
    {
        name: 'remind',
        description: 'Set a reminder',
        options: [
            {
                name: 'time',
                description: 'Time from now (e.g., 10m, 1h)',
                type: 3, // STRING
                required: true,
            },
            {
                name: 'message',
                description: 'What to remind you about',
                type: 3, // STRING
                required: true,
            },
            {
                name: 'channel',
                description: 'The channel or ticket to ping you in',
                type: 7, // CHANNEL
                required: false,
            },
            {
                name: 'user',
                description: 'The user to DM the reminder to (defaults to you)',
                type: 6, // USER
                required: false,
            }
        ],
    },
    {
        name: 'add_money',
        description: 'Add money to a user',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'user',
                description: 'The user to add money to',
                type: 6, // USER
                required: true,
            },
            {
                name: 'amount',
                description: 'The amount of money to add',
                type: 10, // NUMBER
                required: true,
            }
        ],
    },
    {
        name: 'balance',
        description: 'Check your balance or another user\'s balance',
        options: [
            {
                name: 'user',
                description: 'The user to check the balance of',
                type: 6, // USER
                required: false,
            }
        ],
    },
    {
        name: 'remove_money',
        description: 'Remove money from a user',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'user',
                description: 'The user to remove money from',
                type: 6, // USER
                required: true,
            },
            {
                name: 'amount',
                description: 'The amount of money to remove',
                type: 10, // NUMBER
                required: true,
            }
        ],
    },
    {
        name: 'cd',
        description: 'Set a 24-hour cooldown for a user',
        options: [
            {
                name: 'user',
                description: 'The user to put on cooldown',
                type: 6, // USER
                required: true,
            },
            {
                name: 'time',
                description: 'The duration of the cooldown (e.g., 12h, 1d). Defaults to 24h.',
                type: 3, // STRING
                required: false,
            }
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
