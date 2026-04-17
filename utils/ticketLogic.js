/**
 * utils/ticketLogic.js
 * All ticket creation, closing, and management logic.
 */
const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ChannelType, PermissionFlagsBits, UserSelectMenuBuilder,
} = require('discord.js');
const transcript = require('discord-html-transcripts');
const db = require('./database');
const { ticketWelcomeEmbed, COLORS, divider, footerQuip } = require('./embeds');

async function createTicket(interaction, category, answers) {
    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply({ content: "I don't have the `Manage Channels` permission! Please fix my role permissions. 🎀" });
    }

    const count = db.incrementTicketCount(interaction.guildId);
    const paddedCount = count.toString().padStart(4, '0');
    const staffRoles = JSON.parse(category.roles || '[]');

    let channel;
    try {
        channel = await interaction.guild.channels.create({
            name: `ticket-${paddedCount}`,
            type: ChannelType.GuildText,
            parent: category.categoryId,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                },
                ...staffRoles.map(roleId => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                })),
            ],
        });
    } catch (err) {
        const msg = err.code === 50035
            ? 'Invalid category channel. Please recreate the ticket category with a valid Discord channel category! 🌷'
            : `Failed to create ticket channel: ${err.message}`;
        return interaction.editReply({ content: msg });
    }

    db.createTicket({
        channelId: channel.id,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        categoryId: category.id,
        createdAt: Date.now(),
        answers,
    });

    const embed = ticketWelcomeEmbed(interaction.user, paddedCount, category, answers);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('✦ Claim').setEmoji('👤').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_manage_users').setLabel('Manage Users').setEmoji('⚙️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ticket_close_prompt').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );

    const roleMention = staffRoles[0] ? `<@&${staffRoles[0]}>` : '';
    await channel.send({ content: `${interaction.user} ${roleMention}`.trim(), embeds: [embed], components: [row] });
    await interaction.editReply({ content: `✨ Your ticket is ready! Head over to ${channel} 🎀` });
}

async function claimTicket(interaction) {
    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    if (ticket.claimantId) {
        return interaction.reply({ content: `This ticket is already claimed by <@${ticket.claimantId}>!`, ephemeral: true });
    }

    db.updateTicket(interaction.channelId, { claimantId: interaction.user.id });

    // Update the message buttons to show who claimed it
    const message = interaction.message;
    const oldRow = message.components[0];
    const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder(oldRow.components[0].data).setLabel(`Claimed by ${interaction.user.username}`).setDisabled(true),
        new ButtonBuilder(oldRow.components[1].data),
        new ButtonBuilder(oldRow.components[2].data),
    );

    await interaction.update({ components: [newRow] });
    await interaction.followUp({
        content: `✅ Ticket claimed by ${interaction.user}!`,
        allowedMentions: { parse: [] },
    });
}

async function closePrompt(interaction) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('🔒  Close this Ticket?')
        .setDescription(
            `Are you sure you want to close this ticket?\n\n` +
            `A full transcript will be generated and saved, then the channel will be deleted.\n\n` +
            `*${divider()}*`
        )
        .setFooter({ text: '⏳ This action cannot be undone!' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Yes, Close It').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Keep Open').setEmoji('🌸').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
    });
}

async function closeTicket(interaction) {
    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This channel is not a ticket.')], ephemeral: true });
    }

    const config = db.getGuildConfig(interaction.guildId);

    const closingEmbed = new EmbedBuilder()
        .setColor(COLORS.lilac ?? COLORS.info)
        .setTitle('📄  Wrapping Up...')
        .setDescription('🔒 Closing ticket and generating a beautiful transcript for your records~\n\n*Please wait a moment!* 🌸')
        .setFooter({ text: footerQuip() })
        .setTimestamp();

    await interaction.reply({ embeds: [closingEmbed] });

    let file;
    try {
        file = await transcript.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `transcript-${interaction.channel.name}.html`,
        });
    } catch (err) {
        console.error('[Ticket] Transcript error:', err.message);
    }

    db.updateTicket(interaction.channelId, { status: 'closed', closedAt: Date.now() });

    const sendPayload = { content: `🎀 Transcript for **${interaction.channel.name}** — closed by ${interaction.user}. ✨` };
    if (file) sendPayload.files = [file];

    // Log to log channel
    if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) await logChannel.send(sendPayload).catch(() => {});
    }

    // Transcript channel
    if (config.transcriptChannelId) {
        const transcriptChannel = interaction.guild.channels.cache.get(config.transcriptChannelId);
        if (transcriptChannel) await transcriptChannel.send(sendPayload).catch(() => {});
    }

    // DM opener
    try {
        const opener = await interaction.client.users.fetch(ticket.userId);
        await opener.send({
            content: `✨ Your ticket **${interaction.channel.name}** has been closed! Here's your transcript for reference. Thanks for reaching out~ 🌸🎀`,
            ...(file ? { files: [file] } : {}),
        });
    } catch { /* DMs may be closed */ }

    await interaction.channel.delete().catch(() => {});
}

async function manageUsers(interaction) {
    const config = db.getGuildConfig(interaction.guildId);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRoleId && interaction.member.roles.cache.has(config.adminRoleId));

    if (!isAdmin) {
        return interaction.reply({ content: 'Only administrators can manage users in tickets! 🎀', ephemeral: true });
    }

    const select = new UserSelectMenuBuilder()
        .setCustomId('ticket_user_select')
        .setPlaceholder('Select users to add or remove...')
        .setMinValues(0)
        .setMaxValues(10);

    const manageEmbed = new EmbedBuilder()
        .setColor(COLORS.sky ?? COLORS.info)
        .setTitle('👥  Manage Ticket Access')
        .setDescription(
            `Select the users you want to **add** to this ticket below.\n` +
            `Deselecting a user will **remove** their access.\n\n` +
            `*${divider()}*`
        )
        .setFooter({ text: '🌸 Changes apply instantly!' })
        .setTimestamp();

    await interaction.reply({
        embeds: [manageEmbed],
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true,
    });
}

async function handleUserUpdate(interaction) {
    const config = db.getGuildConfig(interaction.guildId);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRoleId && interaction.member.roles.cache.has(config.adminRoleId));

    if (!isAdmin) {
        return interaction.reply({ content: 'Only administrators can manage users in tickets! 🎀', ephemeral: true });
    }

    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) return interaction.update({ embeds: [errorEmbed('Could not find ticket data.')], components: [] });

    const category = db.getCategory(ticket.categoryId);
    const staffRoles = JSON.parse(category?.roles || '[]');
    const selectedUsers = interaction.values;

    await interaction.deferUpdate();

    const overwrites = [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
            id: ticket.userId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        },
        ...staffRoles.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        })),
        ...selectedUsers.map(userId => ({
            id: userId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        })),
    ];

    await interaction.channel.permissionOverwrites.set(overwrites);

    const successEmbed = new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle('✅  Access Updated!')
        .setDescription(`🌸 Successfully updated ticket access for **${selectedUsers.length}** user(s)!\n\n*${divider()}*`)
        .setFooter({ text: footerQuip() })
        .setTimestamp();

    await interaction.followUp({
        embeds: [successEmbed],
        ephemeral: true,
    });
}

module.exports = { createTicket, claimTicket, closePrompt, closeTicket, manageUsers, handleUserUpdate };
