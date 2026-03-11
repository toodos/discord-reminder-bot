/**
 * Ticket Panel Command Handler
 * Handles the creation and management of ticket panels.
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');

module.exports = {
    execute: async (interaction) => {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const categories = db.getCategories(interaction.guildId);
            if (categories.length === 0) {
                return interaction.reply({ content: 'You must first create at least one category using `/category create`!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#ff85a2')
                .setTitle(title)
                .setDescription(description)
                .setTimestamp();

            const rows = [];
            let currentRow = new ActionRowBuilder();

            categories.forEach((cat, i) => {
                if (i > 0 && i % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_open_${cat.id}`)
                        .setLabel(cat.name)
                        .setEmoji(cat.emoji)
                        .setStyle(ButtonStyle.Primary)
                );
            });
            rows.push(currentRow);

            const msg = await channel.send({ embeds: [embed], components: rows });
            
            // Note: In a full impl, we'd save panel info to DB for editing later
            await interaction.reply({ content: `Panel successfully created in ${channel}! ✨`, ephemeral: true });
        }
    }
};
