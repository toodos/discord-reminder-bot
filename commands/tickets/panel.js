/**
 * commands/tickets/panel.js
 */
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../../utils/database");
const { COLORS, errorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "panel",
  description: "Send the ticket creation panel to the current channel.",
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");
      const channel =
        interaction.options.getChannel("channel") || interaction.channel;

      const categories = db.getCategories(interaction.guildId);
      if (categories.length === 0) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              "Create at least one category with `/category create` first!",
            ),
          ],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.gold)
        .setTitle(title)
        .setDescription(
          `${description}\n\n` +
            `◈ ━━━━━━━━ ◈ ━━━━━━━━ ◈\n` +
            `*Select a department below to initiate private concierge communication.*`,
        )
        .setFooter({ text: "👑 Premier Concierge Suite  •  Oakawol Private Service" })
        .setTimestamp();

      // Max 5 buttons per ActionRow
      const rows = [];
      for (let i = 0; i < categories.length; i++) {
        if (i % 5 === 0) rows.push(new ActionRowBuilder());
        rows[rows.length - 1].addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_open_${categories[i].id}`)
            .setLabel(categories[i].name)
            .setEmoji(categories[i].emoji)
            .setStyle(ButtonStyle.Primary),
        );
      }

      await channel.send({ embeds: [embed], components: rows });
      await interaction.reply({
        content: `✨ **Panel deployed** in ${channel}! It looks gorgeous~ 🌸`,
        ephemeral: true,
      });
    }
  },
};
