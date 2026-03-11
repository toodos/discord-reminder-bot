/**
 * Ticket Command Registry
 * Exports an array of ticket-related slash commands for easy integration.
 */
const { PermissionFlagsBits } = require('discord.js');

const commands = [
    {
        name: 'setup',
        description: 'Initial configuration for the ticket system',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'admin_role',
                description: 'The role that can manage all tickets',
                type: 8, // ROLE
                required: true
            },
            {
                name: 'log_channel',
                description: 'Channel for ticket event logs',
                type: 7, // CHANNEL
                required: true
            },
            {
                name: 'transcript_channel',
                description: 'Channel for ticket transcripts',
                type: 7, // CHANNEL
                required: true
            }
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
                type: 1, // SUB_COMMAND
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
                description: 'Create a new ticket category',
                type: 1, // SUB_COMMAND
                options: [
                    { name: 'name', description: 'Category name', type: 3, required: true },
                    { name: 'emoji', description: 'Emoji for the category', type: 3, required: true },
                    { name: 'category', description: 'Discord category to create tickets in', type: 7, required: true },
                    { name: 'support_role', description: 'Role assigned to this category', type: 8, required: true }
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

module.exports = commands;
