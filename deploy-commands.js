/**
 * deploy-commands.js
 * Registers all slash commands with Discord.
 * Run: node deploy-commands.js
 */
require('dotenv').config();
const { REST, Routes, PermissionFlagsBits } = require('discord.js');

const commands = [

    // ── Reminders ──────────────────────────────────────────────────────────────
    {
        name: 'remind',
        description: 'Set a reminder for yourself or someone else ⏰✨',
        options: [
            { name: 'time',    description: 'When? (e.g. 10m, 2h, 1d)',       type: 3, required: true },
            { name: 'message', description: 'What to remind about 🎀',         type: 3, required: true },
            { name: 'channel', description: 'Where to ping (default: here) 🌷', type: 7, required: false },
            { name: 'user',    description: 'Who to remind (default: you) 🐾', type: 6, required: false },
        ],
    },
    {
        name: 'cd',
        description: "Put a user on cooldown (they can't be assigned tasks) 🌙",
        options: [
            { name: 'user', description: 'User to put on cooldown 😴',                         type: 6, required: true },
            { name: 'time', description: 'Duration (e.g. 12h, 1d). Default: 24h ✨',            type: 3, required: false },
        ],
    },
    {
        name: 'remove_cd',
        description: 'Remove a cooldown early ☀️✨',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'user', description: 'User to wake up 🐾', type: 6, required: true },
        ],
    },

    // ── Economy ────────────────────────────────────────────────────────────────
    {
        name: 'balance',
        description: 'Check a sparkly vault balance + global leaderboard 💎🌸',
        options: [
            { name: 'user', description: "Whose vault? (default: yours) 🎀", type: 6, required: false },
        ],
    },
    {
        name: 'add_money',
        description: 'Add money to a user\'s balance 💰✨',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'user',   description: 'The lucky user 🍭',  type: 6,  required: true },
            { name: 'amount', description: 'How much? 💎',        type: 10, required: true },
        ],
    },
    {
        name: 'remove_money',
        description: 'Remove money from a user\'s balance 💸🌷',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'user',   description: 'The user to deduct from 🐾', type: 6,  required: true },
            { name: 'amount', description: 'Amount to remove 🍭',         type: 10, required: true },
        ],
    },

    // ── Admin Utilities ────────────────────────────────────────────────────────
    {
        name: 'verify',
        description: 'Manually verify a Reddit link in the current channel 🎀',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'link', description: 'Message ID or link (default: auto-detect) 🌷', type: 3, required: false },
        ],
    },
    {
        name: 'text',
        description: 'Send a message as the bot 🎀',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'message', description: 'What should I say? ✨', type: 3, required: true },
        ],
    },
    {
        name: 'memory',
        description: 'Manage bot memory slots 🎀',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'set', description: 'Save a message to a slot ✨', type: 1,
                options: [
                    { name: 'slot', description: 'Slot (1–4)', type: 4, required: true, choices: [1,2,3,4].map(n => ({ name: `Slot ${n}`, value: n })) },
                    { name: 'message', description: 'Message to store 🍰', type: 3, required: true },
                ],
            },
            {
                name: 'get', description: 'Send a stored message 🍬', type: 1,
                options: [
                    { name: 'slot', description: 'Slot (1–4)', type: 4, required: true, choices: [1,2,3,4].map(n => ({ name: `Slot ${n}`, value: n })) },
                ],
            },
            { name: 'list', description: 'See all memory slots 📋', type: 1 },
        ],
    },

    // ── Context Menus ──────────────────────────────────────────────────────────
    {
        name: 'Verify Link',
        type: 3, // MESSAGE context menu
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },

    // ── Ticket System ──────────────────────────────────────────────────────────
    {
        name: 'setup',
        description: 'Configure the ticket system 🎫',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            { name: 'admin_role',          description: 'Role that manages all tickets',    type: 8, required: true },
            { name: 'log_channel',         description: 'Channel for ticket event logs',    type: 7, required: true },
            { name: 'transcript_channel',  description: 'Channel for ticket transcripts',   type: 7, required: true },
        ],
    },
    {
        name: 'panel',
        description: 'Manage ticket panels',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'create', description: 'Create a ticket panel in a channel', type: 1,
                options: [
                    { name: 'title',       description: 'Panel title',                       type: 3, required: true },
                    { name: 'description', description: 'Panel description',                  type: 3, required: true },
                    { name: 'channel',     description: 'Where to post (default: here) 🌷',  type: 7, required: false },
                ],
            },
        ],
    },
    {
        name: 'category',
        description: 'Manage ticket categories',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'create', description: 'Create a ticket department 🎀', type: 1,
                options: [
                    { name: 'name',         description: 'Category name 🌷',                 type: 3, required: true },
                    { name: 'emoji',        description: 'Button emoji ✨',                   type: 3, required: true },
                    { name: 'category',     description: 'Discord channel category 🌸',       type: 7, required: true },
                    { name: 'support_role', description: 'Role that can see these tickets 🎀', type: 8, required: true },
                ],
            },
            { name: 'list',   description: 'List all ticket categories 🌸', type: 1 },
            {
                name: 'delete', description: 'Delete a ticket category 🗑️', type: 1,
                options: [
                    { name: 'id', description: 'Category ID (from /category list)', type: 3, required: true, autocomplete: true },
                ],
            },
        ],
    },
    {
        name: 'close',
        description: 'Close the current ticket 🔒',
        options: [
            { name: 'reason', description: 'Reason for closing', type: 3, required: false },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        if (process.env.GUILD_ID) {
            console.log(`[Deploy] Deploying ${commands.length} commands to guild ${process.env.GUILD_ID}...`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('[Deploy] Done! Commands available instantly.');
        } else {
            console.log(`[Deploy] Deploying ${commands.length} commands globally (up to 1 hour)...`);
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('[Deploy] Done!');
        }
    } catch (error) {
        console.error('[Deploy] Failed:', error);
    }
})();
