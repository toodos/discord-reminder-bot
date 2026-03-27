/**
 * commands/reminders/cd.js
 */
const db = require('../../utils/database');
const { parseTime } = require('../../utils/timer');
const { scheduleCooldown } = require('../../utils/timerManager');
const { cooldownSetEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
    name: 'cd',
    description: 'Set a cooldown timer for a user, restricting them from doing actions until the cooldown expires.',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const timeStr    = interaction.options.getString('time') || '24h';

        const existing = db.getCooldown(targetUser.id);
        if (existing) {
            const unix = Math.floor(existing.endTime / 1000);
            return interaction.reply({
                embeds: [errorEmbed(`${targetUser.tag} already has an active cooldown!\nIt expires <t:${unix}:R>. 🌙`)],
                ephemeral: true,
            });
        }

        const duration = parseTime(timeStr);
        if (!duration) {
            return interaction.reply({
                embeds: [errorEmbed("I couldn't understand that time format. Try `24h`, `1d`, or `12h`. 🌸")],
                ephemeral: true,
            });
        }

        const endTime = Date.now() + duration;
        db.setCooldown(targetUser.id, interaction.channelId, endTime, interaction.user.id);

        const cdData = { userId: targetUser.id, channelId: interaction.channelId, endTime, initiatorId: interaction.user.id };
        scheduleCooldown(cdData);

        const { file, embed } = cooldownSetEmbed(targetUser, timeStr, endTime, interaction.user);
        await interaction.reply({ embeds: [embed], files: [file] });
    },
};
