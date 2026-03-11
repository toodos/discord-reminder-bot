/**
 * Ticket System Logic Handler
 * Migrated to utils/ticket-logic.js
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, UserSelectMenuBuilder, ComponentType } = require('discord.js');
const ticketDb = require('./ticket-db');
const transcript = require('discord-html-transcripts');

module.exports = {
    createTicket: async (interaction, category, answers) => {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
        
        const count = ticketDb.incrementTicketCount(interaction.guildId);
        const paddedCount = count.toString().padStart(4, '0');

        // Check if the bot has permission to manage channels
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            throw new Error("I don't have the 'Manage Channels' permission to create a ticket! 🎀");
        }

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
        }).catch(err => {
            if (err.code === 50035) throw new Error("Invalid Category ID. Please recreate the ticket category with a valid Discord Category! 🌷");
            throw err;
        });

        ticketDb.createTicket({
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
        const ticket = ticketDb.getTicket(interaction.channelId);
        if (ticket.claimantId) return interaction.reply({ content: 'This ticket is already claimed!', ephemeral: true });

        ticketDb.updateTicket(interaction.channelId, { claimantId: interaction.user.id });
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
        const ticket = ticketDb.getTicket(interaction.channelId);
        const config = ticketDb.getGuildConfig(interaction.guildId);
        
        await interaction.reply('Closing ticket and generating transcript...');
        
        const file = await transcript.createTranscript(interaction.channel, {
            limit: -1,
            fileName: `transcript-${interaction.channel.name}.html`
        });

        ticketDb.updateTicket(interaction.channelId, { status: 'closed', closedAt: Date.now() });

        if (config.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                await logChannel.send({ 
                    content: `Ticket **${interaction.channel.name}** closed by ${interaction.user}`,
                    files: [file] 
                });
            }
        }

        try {
            const user = await interaction.client.users.fetch(ticket.userId);
            await user.send({ 
                content: `Your ticket **${interaction.channel.name}** has been closed. Here is your transcript.`,
                files: [file] 
            });
        } catch (e) {}

        await interaction.channel.delete();
    },

    manageUsers: async (interaction) => {
        const select = new UserSelectMenuBuilder()
            .setCustomId('ticket_user_select')
            .setPlaceholder('Select users to add or remove... 🎀')
            .setMinValues(0)
            .setMaxValues(10);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: 'Select the users you want to add to this ticket! 🌸\n*(Already added users will stay unless you unselect them)*',
            components: [row],
            ephemeral: true
        });
    },

    handleUserUpdate: async (interaction) => {
        const users = interaction.values;
        const channel = interaction.channel;

        await interaction.deferUpdate();

        // Get current overrides to keep staff and owner
        const ticket = ticketDb.getTicket(channel.id);
        
        // Reset permissions for all users not in the new list (except staff/owner)
        // We'll just overwrite with the new list + core entities
        const category = ticketDb.getCategory(ticket.categoryId);
        const staffRoles = JSON.parse(category.roles || '[]');

        const overwrites = [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: ticket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
            ...staffRoles.map(roleId => ({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
            })),
            ...users.map(userId => ({
                id: userId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
            }))
        ];

        await channel.setPermissionOverwrites(overwrites);

        await interaction.followUp({ 
            content: `✅ Updated ticket access! Updated ${users.length} added user(s). ✨`, 
            ephemeral: true 
        });
    }
};
