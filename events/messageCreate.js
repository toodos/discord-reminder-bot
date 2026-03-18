/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels.
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const { REDDIT_REGEX, LOADING_EMOJI } = require('../commands/admin/verify');

const URL_REGEX = /https?:\/\/[^\s]+/;

module.exports = async function onMessageCreate(message) {
    if (message.author.bot || !message.guild) return;

    const ticket = db.getTicket(message.channel.id);
    if (!ticket) return;

    const config  = db.getGuildConfig(message.guild.id);
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    (config.adminRoleId && message.member.roles.cache.has(config.adminRoleId));
    if (isAdmin) return;

    const urlMatch = message.content.match(URL_REGEX);
    if (!urlMatch) return;

    const url = urlMatch[0];

    try {
        if (REDDIT_REGEX.test(url)) {
            await message.react(LOADING_EMOJI);
        } else {
            await message.react('✅');
        }
    } catch (err) {
        console.error('[LinkCheck] Failed to react:', err.message);
    }
};
