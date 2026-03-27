/**
 * commands/economy/balance.js
 */
const db = require('../../utils/database');
const { balanceEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'balance',
    description: 'Check your own or another user\'s current coin balance and leaderboard ranking.',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userData   = db.getUser(targetUser.id);
        const allUsers   = db.getAllUsers(); // already sorted DESC by balance

        const trophies = ['🥇', '🥈', '🥉'];
        const top3 = allUsers.slice(0, 3);
        const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;

        const leaderboardStr = top3
            .map((u, i) => `${trophies[i]} <@${u.userId}>: **₹${u.balance.toLocaleString()}**`)
            .join('\n')
            + (rank > 3 ? `\n\n...You are at **#${rank}**` : '');

        const totalEconomy = allUsers.reduce((sum, u) => sum + u.balance, 0);

        const { file, embed } = balanceEmbed(interaction.client, targetUser, userData.balance, rank, leaderboardStr, totalEconomy);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
