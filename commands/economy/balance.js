/**
 * commands/economy/balance.js
 */
const db = require('../../utils/database');
const { balanceEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'balance',
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

        const { file, embed } = balanceEmbed(interaction.client, targetUser, userData.balance, rank, leaderboardStr);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
