/**
 * commands/admin/text.js
 */
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'text',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can use this command! 🎀', ephemeral: true });
        }
        const message = interaction.options.getString('message');
        await interaction.reply({ content: '✅ Sending...', ephemeral: true });
        await interaction.channel.send(message);
    },
};
