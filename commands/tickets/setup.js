/**
 * commands/tickets/setup.js
 */
const db = require('../../utils/database');

module.exports = {
    name: 'setup',
    async execute(interaction) {
        const adminRole          = interaction.options.getRole('admin_role');
        const logChannel         = interaction.options.getChannel('log_channel');
        const transcriptChannel  = interaction.options.getChannel('transcript_channel');

        db.setGuildConfig(interaction.guildId, {
            adminRoleId: adminRole.id,
            logChannelId: logChannel.id,
            transcriptChannelId: transcriptChannel.id,
        });

        await interaction.reply({
            content: `✅ **Ticket System Configured!**\n\n**Admin Role:** ${adminRole}\n**Logs:** ${logChannel}\n**Transcripts:** ${transcriptChannel}\n\nRun \`/category create\` to set up your departments! ✨`,
            ephemeral: true,
        });
    },
};
