/**
 * Ticket Interaction Handler
 * Manages all ticket-related interactions: Buttons, Select Menus, and Modals.
 */
const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

module.exports = async (interaction, client) => {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') return await require('../commands/setup').execute(interaction);
        if (interaction.commandName === 'panel') return await require('../commands/panel').execute(interaction);
        if (interaction.commandName === 'category') return await require('../commands/category').execute(interaction);
        if (interaction.commandName === 'close') return await require('../handlers/ticketLogic').closeTicket(interaction);
        return;
    }

    // Ticket Panel Button Click
    if (interaction.isButton() && interaction.customId.startsWith('ticket_open_')) {
        const categoryId = interaction.customId.replace('ticket_open_', '');
        const category = db.getCategory(categoryId);
        if (!category) return interaction.reply({ content: 'Invalid category!', ephemeral: true });

        // Check blacklist
        if (db.isBlacklisted(interaction.guildId, interaction.user.id)) {
            return interaction.reply({ content: 'You are blacklisted from opening tickets.', ephemeral: true });
        }

        // Check max tickets
        const active = db.getUserActiveTickets(interaction.user.id, interaction.guildId);
        if (active.length >= category.maxTickets) {
            return interaction.reply({ content: `You already have ${active.length} open ticket(s) in this category.`, ephemeral: true });
        }

        const questions = JSON.parse(category.questions || '[]');
        if (questions.length > 0) {
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${categoryId}`)
                .setTitle(`${category.name} Information`);

            questions.forEach((q, i) => {
                const input = new TextInputBuilder()
                    .setCustomId(`question_${i}`)
                    .setLabel(q.label)
                    .setStyle(q.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setPlaceholder(q.placeholder || '')
                    .setRequired(q.required !== false);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
            });

            return await interaction.showModal(modal);
        }

        // Create ticket immediately if no questions
        return await require('../handlers/ticketLogic').createTicket(interaction, category, {});
    }

    // Modal Submission (Ticket Form)
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
        const categoryId = interaction.customId.replace('ticket_modal_', '');
        const category = db.getCategory(categoryId);
        const questions = JSON.parse(category.questions || '[]');
        
        const answers = {};
        questions.forEach((q, i) => {
            answers[q.label] = interaction.fields.getTextInputValue(`question_${i}`);
        });

        return await require('../handlers/ticketLogic').createTicket(interaction, category, answers);
    }

    // Management Buttons (Close, Claim, etc.)
    if (interaction.isButton()) {
        const ticket = db.getTicket(interaction.channelId);
        if (!ticket) return;

        const logic = require('../handlers/ticketLogic');

        switch (interaction.customId) {
            case 'ticket_close_prompt':
                await logic.closePrompt(interaction);
                break;
            case 'ticket_close_confirm':
                await logic.closeTicket(interaction);
                break;
            case 'ticket_claim':
                await logic.claimTicket(interaction);
                break;
            case 'ticket_manage_users':
                await logic.manageUsersPrompt(interaction);
                break;
        }
    }
};
