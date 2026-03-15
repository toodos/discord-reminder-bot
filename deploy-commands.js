require('dotenv').config();
const { REST, Routes, PermissionFlagsBits } = require('discord.js');

const ticketCommands = [
    {
        name: 'setup',
        description: 'Initial configuration for the ticket system',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'admin_role', description: 'The role that can manage all tickets', type: 8, required: true },
            { name: 'log_channel', description: 'Channel for ticket event logs', type: 7, required: true },
            { name: 'transcript_channel', description: 'Channel for ticket transcripts', type: 7, required: true }
        ]
    },
    {
        name: 'panel',
        description: 'Manage ticket panels',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'create',
                description: 'Create a new ticket panel',
                type: 1,
                options: [
                    { name: 'title', description: 'Panel title', type: 3, required: true },
                    { name: 'description', description: 'Panel description', type: 3, required: true },
                    { name: 'channel', description: 'Where to post the panel', type: 7, required: false }
                ]
            }
        ]
    },
    {
        name: 'category',
        description: 'Manage ticket categories',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'create',
                description: 'Create a ticket category 🎀',
                type: 1, // SUB_COMMAND
                options: [
                    { name: 'name', description: 'The name of the ticket 🌷', type: 3, required: true },
                    { name: 'emoji', description: 'The emoji for the button ✨', type: 3, required: true },
                    { name: 'category', description: 'The Discord Category to open tickets in 🌸', type: 7, required: true }, // Assuming type 7 is sufficient for GuildCategory
                    { name: 'support_role', description: 'The role that can see these tickets 🎀', type: 8, required: true }
                ]
            },
            {
                name: 'list',
                description: 'List all ticket categories 🌸',
                type: 1 // SUB_COMMAND
            },
            {
                name: 'delete',
                description: 'Delete a ticket category 🗑️',
                type: 1, // SUB_COMMAND
                options: [
                    { name: 'id', description: 'The category ID to delete (find it in /category list) 🍡', type: 3, required: true }
                ]
            }
        ]
    },
    {
        name: 'close',
        description: 'Close the current ticket',
        options: [
            { name: 'reason', description: 'Reason for closing', type: 3, required: false }
        ]
    }
];

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
    {
        name: 'Verify Link',
        type: 3, // MESSAGE
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },
    {
        name: 'verify',
        description: 'Verify a Reddit link manually 🎀',
        options: [
            {
                name: 'link',
                description: 'The link to the message containing the Reddit link 🌷',
                type: 3, // STRING
                required: false,
            }
        ]
    },
    {
        name: 'text',
        description: 'Send a customizable message as the bot! 🎀',
        options: [
            {
                name: 'message',
                description: 'What should I say? ✨',
                type: 3, // STRING
                required: true,
            }
        ]
    },
    {
        name: 'memory',
        description: 'Manage bot memory slots! 🎀',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'set',
                description: 'Set a message in a memory slot ✨',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'slot',
                        description: 'Memory slot (1-4) 🌷',
                        type: 4, // INTEGER
                        required: true,
                        choices: [
                            { name: 'Slot 1', value: 1 },
                            { name: 'Slot 2', value: 2 },
                            { name: 'Slot 3', value: 3 },
                            { name: 'Slot 4', value: 4 }
                        ]
                    },
                    {
                        name: 'message',
                        description: 'The message to remember 🍰',
                        type: 3, // STRING
                        required: true
                    }
                ]
            },
            {
                name: 'get',
                description: 'Send a message from a memory slot 🍬',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'slot',
                        description: 'Memory slot (1-4) 🍭',
                        type: 4, // INTEGER
                        required: true,
                        choices: [
                            { name: 'Slot 1', value: 1 },
                            { name: 'Slot 2', value: 2 },
                            { name: 'Slot 3', value: 3 },
                            { name: 'Slot 4', value: 4 }
                        ]
                    }
                ]
            },
            {
                name: 'list',
                description: 'See all stored memory messages 📋',
                type: 1 // SUB_COMMAND
            }
        ]
    },
    ...ticketCommands
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        if (process.env.GUILD_ID) {
            console.log(`Deploying commands to Guild: ${process.env.GUILD_ID} ✨`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
        } else {
            console.log('Deploying commands Globally (can take up to 1 hour) 🌸');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
        }

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
