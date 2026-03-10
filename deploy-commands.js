require('dotenv').config();
const { REST, Routes, PermissionFlagsBits } = require('discord.js');

const commands = [
    {
        name: 'remind',
        description: 'Set a super-duper reminder! ⏰✨',
        options: [
            {
                name: 'time',
                description: 'When should I remind you? (e.g., 10m, 1h) ⏳',
                type: 3, // STRING
                required: true,
            },
            {
                name: 'message',
                description: 'What should I remember for you? 🎀',
                type: 3, // STRING
                required: true,
            },
            {
                name: 'channel',
                description: 'Where should I ping you? 🌷',
                type: 7, // CHANNEL
                required: false,
            },
            {
                name: 'user',
                description: 'Who should get the DM? (defaults to you!) 🐾',
                type: 6, // USER
                required: false,
            }
        ],
    },
    {
        name: 'add_money',
        description: 'Shower a user with sparkly money! 💰✨',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'user',
                description: 'The lucky user! 🍭',
                type: 6, // USER
                required: true,
            },
            {
                name: 'amount',
                description: 'How much sparkly money? 💎',
                type: 10, // NUMBER
                required: true,
            }
        ],
    },
    {
        name: 'balance',
        description: 'Peek into your sparkly personal vault! 💎🌸',
        options: [
            {
                name: 'user',
                description: 'Whose vault should we peek into? 🎀',
                type: 6, // USER
                required: false,
            }
        ],
    },
    {
        name: 'remove_money',
        description: 'Oopsie! Take some money away. 💸🌷',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'user',
                description: 'The user to deduct from 🐾',
                type: 6, // USER
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount to remove 🍭',
                type: 10, // NUMBER
                required: true,
            }
        ],
    },
    {
        name: 'cd',
        description: 'Give someone a cozy li\'l nap time! 🌙🌸',
        options: [
            {
                name: 'user',
                description: 'The user who needs a nap 😴',
                type: 6, // USER
                required: true,
            },
            {
                name: 'time',
                description: 'How long for the nap? (e.g., 12h, 1d). Defaults to 24h! ✨',
                type: 3, // STRING
                required: false,
            }
        ],
    },
    {
        name: 'remove_cd',
        description: 'Wake someone up from their nap! ☀️✨',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'user',
                description: 'The sleepy user to wake up 🐾',
                type: 6, // USER
                required: true,
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
