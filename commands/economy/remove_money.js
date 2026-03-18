/**
 * commands/economy/remove_money.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { removeMoneyEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'remove_money',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can remove money! 🎀', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount     = interaction.options.getNumber('amount');

        if (amount <= 0) {
            return interaction.reply({ content: "Amount must be greater than zero! 🍭", ephemeral: true });
        }

        const newBalance = db.removeMoney(targetUser.id, amount);
        const { file, embed } = removeMoneyEmbed(targetUser, amount, newBalance);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
