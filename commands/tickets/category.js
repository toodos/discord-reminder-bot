/**
 * commands/tickets/category.js
 */
const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const { categoryListEmbed, errorEmbed, COLORS } = require('../../utils/embeds');

module.exports = {
    name: 'category',
    description: 'Manage ticket categories (add/remove categories for users).',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const name     = interaction.options.getString('name');
            const emoji    = interaction.options.getString('emoji');
            const category = interaction.options.getChannel('category');
            const role     = interaction.options.getRole('support_role');
            const id       = Math.random().toString(36).slice(2, 9);

            db.createCategory({ id, guildId: interaction.guildId, name, emoji, roles: [role.id], categoryId: category.id, maxTickets: 1, questions: [] });

            await interaction.reply({
                content: `✅ Created category **${name}** ${emoji}!\nRun \`/panel create\` to add it to a ticket panel. ✨`,
                ephemeral: true,
            });

        } else if (sub === 'list') {
            const categories = db.getCategories(interaction.guildId);
            if (categories.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('No ticket categories found! Create one with `/category create`.')], ephemeral: true });
            }

            const embed = categoryListEmbed(categories);
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (sub === 'delete') {
            const id       = interaction.options.getString('id');
            const category = db.getCategory(id);

            if (!category || category.guildId !== interaction.guildId) {
                return interaction.reply({ embeds: [errorEmbed("I couldn't find that category ID. Check `/category list` for valid IDs!")], ephemeral: true });
            }

            db.deleteCategory(id);
            await interaction.reply({ content: `✅ Deleted the **${category.name}** category! 🗑️✨`, ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const categories = db.getCategories(interaction.guildId);

        const filtered = categories.filter(c => 
            c.name.toLowerCase().includes(focusedValue.toLowerCase()) || 
            c.id.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.slice(0, 25).map(c => ({ name: `${c.emoji} ${c.name}`, value: c.id }))
        );
    },
};
