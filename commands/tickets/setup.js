/**
 * commands/tickets/setup.js
 */
const db = require('../../utils/database');
const { EmbedBuilder } = require('discord.js');
const { errorEmbed, COLORS } = require('../../utils/embeds');

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

        const embed = new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('✅ Ticket System Configured')
            .setDescription('The ticket system has been successfully configured with the following settings:')
            .addFields(
                { name: '👤 Admin Role', value: `${adminRole}`, inline: true },
                { name: '📝 Logs', value: `${logChannel}`, inline: true },
                { name: '📄 Transcripts', value: `${transcriptChannel}`, inline: true }
            )
            .setFooter({ text: 'Run /category create to set up your departments!' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    },
};
