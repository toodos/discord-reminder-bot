/**
 * commands/economy/history.js
 */
const db = require('../../utils/database');
const { historyEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'history',
    description: 'View recent transaction history for yourself or another user.',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (!targetUser) {
            return interaction.reply({ embeds: [errorEmbed('Could not determine a valid user! ◈')], ephemeral: true });
        }

        const userData = db.getUser(targetUser.id);
        const transactions = db.getTransactions(targetUser.id, 10);

        const { file, embed } = historyEmbed(targetUser, userData.balance, transactions);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
