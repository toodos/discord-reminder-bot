/**
 * Core Ticket Logic Handler
 * Functions for creating, claiming, and closing tickets.
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const transcript = require('discord-html-transcripts');

module.exports = {
    createTicket: async (interaction, category, answers) => {
        await interaction.deferReply({ ephemeral: true });
        const config = db.getGuildConfig(interaction.guildId);
        const count = db.incrementTicketCount(interaction.guildId);
        const paddedCount = count.toString().padStart(4, '0');

        const channel = await interaction.guild.channels.create({
            name: `ticket-${paddedCount}`,
            type: ChannelType.GuildText,
            parent: category.categoryId,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                ...JSON.parse(category.roles || '[]').map(roleId => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                }))
            ]
        });

        db.createTicket({
            channelId: channel.id,
            guildId: interaction.guildId,
            userId: interaction.user.id,
            categoryId: category.id,
            createdAt: Date.now(),
            answers: answers
        });

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🎫 Ticket #${paddedCount}`)
            .setDescription(`Welcome ${interaction.user}! Staff will be with you shortly.\n\n**Category:** ${category.emoji} ${category.name}`)
            .setTimestamp();

        const answerKeys = Object.keys(answers);
        if (answerKeys.length > 0) {
            welcomeEmbed.addFields(answerKeys.map(k => ({ name: k, value: answers[k], inline: false })));
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_claim').setLabel('👤 Claim').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_close_prompt').setLabel('🔒 Close').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_manage_users').setLabel('➕ Add User').setStyle(ButtonStyle.Secondary)
        );

        await channel.send({ content: `${interaction.user} <@&${JSON.parse(category.roles || '[]')[0] || ''}>`, embeds: [welcomeEmbed], components: [row] });
        await interaction.editReply({ content: `Ticket created! ${channel}` });
    },

    claimTicket: async (interaction) => {
        const ticket = db.getTicket(interaction.channelId);
        if (ticket.claimantId) return interaction.reply({ content: 'This ticket is already claimed!', ephemeral: true });

        db.updateTicket(interaction.channelId, { claimantId: interaction.user.id });
        await interaction.reply({ content: `✅ This ticket has been claimed by ${interaction.user}.`, allowedMentions: { parse: [] } });
    },

    closePrompt: async (interaction) => {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Confirm Close').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [row], ephemeral: true });
    },

    closeTicket: async (interaction) => {
        const ticket = db.getTicket(interaction.channelId);
        const config = db.getGuildConfig(interaction.guildId);
        
        await interaction.reply('Closing ticket and generating transcript...');
        
        const attachment = await transcript.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `transcript-${interaction.channel.name}.html`
        });

        db.updateTicket(interaction.channelId, { status: 'closed', closedAt: Date.now() });

        // Send Logs
        if (config.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                await logChannel.send({ 
                    content: `Ticket **${interaction.channel.name}** closed by ${interaction.user}`,
                    files: [attachment] 
                });
            }
        }

        // DM User
        try {
            const user = await client.users.fetch(ticket.userId);
            await user.send({ 
                content: `Your ticket **${interaction.channel.name}** has been closed. Here is your transcript.`,
                files: [attachment] 
            });
        } catch (e) {}

        await interaction.channel.delete();
    }
};
