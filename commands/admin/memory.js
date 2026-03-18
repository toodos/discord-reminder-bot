/**
 * commands/admin/memory.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { memoryListEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'memory',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can manage bot memory! 🎀', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const slot    = interaction.options.getInteger('slot');
            const message = interaction.options.getString('message');
            db.setMemory(slot, message);
            await interaction.reply({ content: `✅ Saved message to Slot ${slot}! ✨🌸`, ephemeral: true });

        } else if (sub === 'get') {
            const slot    = interaction.options.getInteger('slot');
            const message = db.getMemory(slot);
            if (!message) {
                return interaction.reply({ content: `Slot ${slot} is empty! 🍭`, ephemeral: true });
            }
            await interaction.reply({ content: '✅ Sending...', ephemeral: true });
            await interaction.channel.send(message);

        } else if (sub === 'list') {
            const allMemory = db.getAllMemory();
            const embed = memoryListEmbed(allMemory);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
