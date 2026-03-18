/**
 * commands/economy/add_money.js
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { addMoneyEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'add_money',
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can add money! 🎀', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount     = interaction.options.getNumber('amount');

        if (amount <= 0) {
            return interaction.reply({ content: "Amount must be greater than zero, silly! 🍭", ephemeral: true });
        }

        const newBalance = db.addMoney(targetUser.id, amount);
        const { file, embed } = addMoneyEmbed(targetUser, amount, newBalance);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
