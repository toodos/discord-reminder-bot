/**
 * commands/admin/remove_cd.js
 */
const { PermissionFlagsBits } = require("discord.js");
const db = require("../../utils/database");
const { cooldownRemovedEmbed, errorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "remove_cd",
  description:
    "Remove/Reset an active cooldown and all pending reminders from a user prematurely.",
  async execute(interaction) {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        embeds: [errorEmbed("Only Administrators can wake people up early!")],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser("user");

    if (!targetUser) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Please specify a valid user to remove the cooldown from! 🌸",
          ),
        ],
        ephemeral: true,
      });
    }
    db.removeCooldownByUserId(targetUser.id);
    db.removeRemindersByUserId(targetUser.id);

    const { file, embed } = cooldownRemovedEmbed(targetUser);
    await interaction.reply({ embeds: [embed], files: [file] });
  },
};
