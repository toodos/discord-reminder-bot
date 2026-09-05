/**
 * commands/economy/add_money.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { addMoneyEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'add_money',
    description: 'Administratively add coins/money to a user\'s balance.',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ embeds: [errorEmbed('Only Administrators can add money!')], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount     = interaction.options.getNumber('amount');
        const reason     = interaction.options.getString('reason') || 'Added by Administrator';

        if (!targetUser || !amount) {
            return interaction.reply({ embeds: [errorEmbed('Please specify both a valid user and an amount! 🌸')], ephemeral: true });
        }

        if (amount <= 0) {
            return interaction.reply({ embeds: [errorEmbed('Amount must be greater than zero!')], ephemeral: true });
        }

        const oldBalance = db.getUser(targetUser.id).balance;
        const newBalance = db.addMoney(targetUser.id, amount, reason, interaction.user.id);
        const transactions = db.getTransactions(targetUser.id, 5);
        const { file, embed } = addMoneyEmbed(targetUser, amount, oldBalance, newBalance, transactions);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
