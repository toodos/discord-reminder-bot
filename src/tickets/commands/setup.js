/**
 * Ticket Setup Command Handler
 * Handles initial configuration of the ticket system.
 */
const db = require('../database/db');

module.exports = {
    execute: async (interaction) => {
        const adminRole = interaction.options.getRole('admin_role');
        const logChannel = interaction.options.getChannel('log_channel');
        const transcriptChannel = interaction.options.getChannel('transcript_channel');

        db.setGuildConfig(interaction.guildId, {
            adminRoleId: adminRole.id,
            logChannelId: logChannel.id,
            transcriptChannelId: transcriptChannel.id
        });

        await interaction.reply({
            content: `✅ **Ticket System Configured!**\n\n- **Admin Role:** ${adminRole}\n- **Logs:** ${logChannel}\n- **Transcripts:** ${transcriptChannel}\n\nNow use \`/category create\` to define your departments! ✨`,
            ephemeral: true
        });
    }
};
