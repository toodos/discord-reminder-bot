/**
 * commands/admin/verify.js
 */
const { PermissionFlagsBits } = require('discord.js');

const REDDIT_REGEX = /(?:[a-z0-9-]+\.)?(?:reddit\.com|redd\.it)\/(?:r\/[^\/]+\/)?(?:comments\/[^\/]+(?:\/[^\/]+\/[a-z0-9]+)?|s\/[a-z0-9]+)/i;
const LOADING_EMOJI = '1481725057024917715';
const CHECK_EMOJI   = '1481725300349079673';

module.exports = {
    name: 'verify',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can verify links! 🎀', ephemeral: true });
        }

        const link = interaction.options.getString('link');
        let targetMessage = null;

        if (link) {
            const msgId = link.match(/\d+$/)?.[0] || link;
            targetMessage = await interaction.channel.messages.fetch(msgId).catch(() => null);
            if (!targetMessage) {
                return interaction.reply({ content: "I couldn't find that message! 🍭", ephemeral: true });
            }
        } else {
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            targetMessage = messages.find(m => REDDIT_REGEX.test(m.content)) || null;
        }

        if (!targetMessage) {
            return interaction.reply({ content: "I couldn't find a recent Reddit link to verify! 🍭", ephemeral: true });
        }

        await verifyMessage(interaction, targetMessage);
    },
};

module.exports.verifyMessage = verifyMessage;
module.exports.REDDIT_REGEX  = REDDIT_REGEX;
module.exports.LOADING_EMOJI = LOADING_EMOJI;
module.exports.CHECK_EMOJI   = CHECK_EMOJI;

async function verifyMessage(interaction, message) {
    try {
        const loadingReaction = message.reactions.cache.get(LOADING_EMOJI);
        if (loadingReaction) await loadingReaction.users.remove(interaction.client.user.id).catch(() => {});
        await message.react(CHECK_EMOJI);

        const isReply = interaction.replied || interaction.deferred;
        const replyFn = isReply ? 'followUp' : 'reply';
        await interaction[replyFn]({ content: '🎀 Link verified! ✨', ephemeral: true });

        const botReply = await message.reply('🎀 Sent to Client! ✨🌸🌷');
        setTimeout(() => botReply.delete().catch(() => {}), 5000);
    } catch (err) {
        console.error('[Verify] Error:', err.message);
        const isReply = interaction.replied || interaction.deferred;
        const replyFn = isReply ? 'followUp' : 'reply';
        await interaction[replyFn]({ content: 'Something went wrong while verifying! ❓', ephemeral: true });
    }
}
