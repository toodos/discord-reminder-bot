/**
 * commands/economy/balance.js
 */
const db = require('../../utils/database');
const { balanceEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'balance',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userData   = db.getUser(targetUser.id);
        const allUsers   = db.getAllUsers(); // already sorted DESC by balance

        const totalEconomy = allUsers.reduce((sum, u) => sum + u.balance, 0);

        const { file, embed } = balanceEmbed(interaction.client, targetUser, userData.balance, rank, leaderboardStr, totalEconomy);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
