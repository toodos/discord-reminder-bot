/**
 * Ticket Category Command Handler
 * Handles creation of ticket departments/categories.
 */
const db = require('../database/db');

module.exports = {
    execute: async (interaction) => {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const name = interaction.options.getString('name');
            const emoji = interaction.options.getString('emoji');
            const category = interaction.options.getChannel('category');
            const role = interaction.options.getRole('support_role');

            const id = Math.random().toString(36).substring(2, 9);

            db.createCategory({
                id: id,
                guildId: interaction.guildId,
                name: name,
                emoji: emoji,
                roles: [role.id],
                categoryId: category.id,
                maxTickets: 1,
                questions: [] // Simplified for now, could add interactive modal for questions
            });

            await interaction.reply({
                content: `✅ Created category **${name}** ${emoji}!\nNext step: Run \`/panel create\` to show it to users! ✨`,
                ephemeral: true
            });
        }
    }
};
