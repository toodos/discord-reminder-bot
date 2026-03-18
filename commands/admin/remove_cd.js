/**
 * commands/admin/remove_cd.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { cooldownRemovedEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'remove_cd',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can wake people up early! 🎀', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        db.removeCooldownByUserId(targetUser.id);
        db.removeRemindersByUserId(targetUser.id);

        const { file, embed } = cooldownRemovedEmbed(targetUser);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
