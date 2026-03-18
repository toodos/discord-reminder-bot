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
const { ticketWelcomeEmbed, COLORS } = require('./embeds');

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
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('👤 Claim').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_close_prompt').setLabel('🔒 Close').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_manage_users').setLabel('➕ Manage Users').setStyle(ButtonStyle.Secondary),
    );

    const roleMention = staffRoles[0] ? `<@&${staffRoles[0]}>` : '';
    await channel.send({ content: `${interaction.user} ${roleMention}`.trim(), embeds: [embed], components: [row] });
    await interaction.editReply({ content: `✅ Your ticket has been created! ${channel} 🎀` });
}

async function claimTicket(interaction) {
    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    if (ticket.claimantId) {
        return interaction.reply({ content: `This ticket is already claimed by <@${ticket.claimantId}>!`, ephemeral: true });
    }

    db.updateTicket(interaction.channelId, { claimantId: interaction.user.id });
    await interaction.reply({
        content: `✅ Ticket claimed by ${interaction.user}! 🎀`,
        allowedMentions: { parse: [] },
    });
}

async function closePrompt(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Yes, Close It').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Nevermind').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({
        content: '⚠️ Are you sure you want to close this ticket? A transcript will be saved.',
        components: [row],
        ephemeral: true,
    });
}

async function closeTicket(interaction) {
    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) {
        return interaction.reply({ content: 'This channel is not a ticket.', ephemeral: true });
    }

    const config = db.getGuildConfig(interaction.guildId);

    await interaction.reply({ content: '🔒 Closing ticket and generating transcript...' });

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

    const sendPayload = { content: `📋 Transcript for **${interaction.channel.name}**, closed by ${interaction.user}.` };
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
            content: `Your ticket **${interaction.channel.name}** has been closed. Here's your transcript! 🎀`,
            ...(file ? { files: [file] } : {}),
        });
    } catch { /* DMs may be closed */ }

    await interaction.channel.delete().catch(() => {});
}

async function manageUsers(interaction) {
    const select = new UserSelectMenuBuilder()
        .setCustomId('ticket_user_select')
        .setPlaceholder('Select users to add or remove...')
        .setMinValues(0)
        .setMaxValues(10);

    await interaction.reply({
        content: '🌸 Select users to add to this ticket. Unselecting removes their access.',
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true,
    });
}

async function handleUserUpdate(interaction) {
    const ticket = db.getTicket(interaction.channelId);
    if (!ticket) return interaction.update({ content: 'Could not find ticket data.', components: [] });

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

    await interaction.followUp({
        content: `✅ Updated ticket access for ${selectedUsers.length} user(s). ✨`,
        ephemeral: true,
    });
}

module.exports = { createTicket, claimTicket, closePrompt, closeTicket, manageUsers, handleUserUpdate };
