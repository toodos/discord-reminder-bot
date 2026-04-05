/**
 * commands/admin/upi.js
 * Save & lookup UPI IDs + QR codes per user per guild.
 */
const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { COLORS, divider, footerQuip, errorEmbed } = require('../../utils/embeds');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'upi',
    description: 'Save or look up a user\'s UPI ID and QR code 💳',
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ── SET ───────────────────────────────────────────────────────────────
        if (sub === 'set') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ embeds: [errorEmbed('Only Administrators can save UPI info!')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const upiId      = interaction.options.getString('upi_id');
            const attachment = interaction.options.getAttachment('qr_code');

            // Validate UPI format loosely
            if (!upiId.includes('@')) {
                return interaction.reply({ embeds: [errorEmbed('That doesn\'t look like a valid UPI ID! It should contain `@` (e.g. `name@upi`). 🌸')], ephemeral: true });
            }

            let qrFilename = null;
            if (attachment) {
                const ext = attachment.name.split('.').pop() || 'png';
                qrFilename = `qr_${targetUser.id}_${interaction.guildId}.${ext}`;
                const qrPath = path.join(__dirname, '../../assets/qr', qrFilename);
                
                try {
                    const res = await fetch(attachment.url);
                    if (!res.ok) throw new Error(`Failed to fetch QR code: ${res.statusText}`);
                    const buffer = await res.arrayBuffer();
                    fs.writeFileSync(qrPath, Buffer.from(buffer));
                } catch (err) {
                    console.error('[UPI Error] Failed to save QR code:', err);
                    return interaction.reply({ embeds: [errorEmbed('Failed to save the QR code image locally! 🧊')], ephemeral: true });
                }
            }

            db.setUpi(targetUser.id, interaction.guildId, upiId, qrFilename);

            const embed = new EmbedBuilder()
                .setColor(COLORS.mint)
                .setTitle('✦  UPI Info Saved! 💳')
                .setDescription(
                    `**${targetUser.username}'s** payment details have been saved to the vault!\n\n` +
                    `*${divider()}*`
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤  User',   value: `${targetUser}`,  inline: true },
                    { name: '💳  UPI ID', value: `\`${upiId}\``,   inline: true }
                )
                .setFooter({ text: footerQuip() })
                .setTimestamp();

            const files = [];
            if (qrFilename) {
                const qrPath = path.join(__dirname, '../../assets/qr', qrFilename);
                const file = new AttachmentBuilder(qrPath, { name: qrFilename });
                embed.setImage(`attachment://${qrFilename}`);
                files.push(file);
            }

            return interaction.reply({ embeds: [embed], files });
        }

        // ── GET ───────────────────────────────────────────────────────────────
        if (sub === 'get') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const record     = db.getUpi(targetUser.id, interaction.guildId);

            if (!record) {
                return interaction.reply({
                    embeds: [errorEmbed(`No UPI info saved for **${targetUser.username}** yet!\nAn admin can add it with \`/upi set\`. 🌸`)],
                    ephemeral: true,
                });
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.gold)
                .setTitle(`💳  ${targetUser.username}'s UPI Details`)
                .setDescription(
                    `Here are the saved payment details!\n\n` +
                    `*${divider()}*`
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤  User',       value: `${targetUser}`,                                                 inline: true },
                    { name: '💳  UPI ID',     value: `\`${record.upiId}\``,                                           inline: true },
                    { name: '🗓️  Saved',      value: `<t:${Math.floor(record.savedAt / 1000)}:R>`,                    inline: true }
                )
                .setFooter({ text: `💖 Tap UPI ID to copy  •  ${footerQuip()}` })
                .setTimestamp();

            const files = [];
            if (record.qrUrl) {
                if (record.qrUrl.startsWith('http')) {
                    // Legacy support for hosted URLs
                    embed.setImage(record.qrUrl);
                } else {
                    // Local file
                    const qrPath = path.join(__dirname, '../../assets/qr', record.qrUrl);
                    if (fs.existsSync(qrPath)) {
                        const file = new AttachmentBuilder(qrPath, { name: record.qrUrl });
                        embed.setImage(`attachment://${record.qrUrl}`);
                        files.push(file);
                    }
                }
                embed.addFields({ name: '🖼️  QR Code', value: 'Shown below — scan to pay!', inline: false });
            } else {
                embed.addFields({ name: '🖼️  QR Code', value: '*No QR code saved yet.*', inline: false });
            }

            return interaction.reply({ embeds: [embed], files });
        }

        // ── DELETE ────────────────────────────────────────────────────────────
        if (sub === 'delete') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ embeds: [errorEmbed('Only Administrators can delete UPI info!')], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const existing   = db.getUpi(targetUser.id, interaction.guildId);

            if (!existing) {
                return interaction.reply({ embeds: [errorEmbed(`No UPI info found for **${targetUser.username}**. 🌸`)], ephemeral: true });
            }

            db.deleteUpi(targetUser.id, interaction.guildId);

            const embed = new EmbedBuilder()
                .setColor(COLORS.danger)
                .setTitle('🗑️  UPI Info Deleted')
                .setDescription(`Payment details for **${targetUser.username}** have been removed.\n\n*${divider()}*`)
                .setFooter({ text: footerQuip() })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── LIST ──────────────────────────────────────────────────────────────
        if (sub === 'list') {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ embeds: [errorEmbed('Only Administrators can view all UPI records!')], ephemeral: true });
            }

            const records = db.getAllUpi(interaction.guildId);

            if (!records.length) {
                return interaction.reply({ embeds: [errorEmbed('No UPI info saved on this server yet! 🌱')], ephemeral: true });
            }

            const lines = records.map(r =>
                `<@${r.userId}> — \`${r.upiId}\` ${r.qrUrl ? '🖼️' : ''}`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setColor(COLORS.lilac ?? COLORS.info)
                .setTitle('💳  All Saved UPI Records')
                .setDescription(`${lines}\n\n*${divider()}*`)
                .setFooter({ text: `${records.length} record(s)  •  ${footerQuip()}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
