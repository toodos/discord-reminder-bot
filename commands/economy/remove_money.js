/**
 * commands/economy/remove_money.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { removeMoneyEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'remove_money',
    description: 'Administratively remove coins/money from a user\'s balance.',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ embeds: [errorEmbed('Only Administrators can remove money!')], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount     = interaction.options.getNumber('amount');

        if (amount <= 0) {
            return interaction.reply({ embeds: [errorEmbed('Amount must be greater than zero!')], ephemeral: true });
        }

        const oldBalance = db.getUser(targetUser.id).balance;
        const newBalance = db.removeMoney(targetUser.id, amount);
        const { file, embed } = removeMoneyEmbed(targetUser, amount, oldBalance, newBalance);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
