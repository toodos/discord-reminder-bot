/**
 * handlers/interactionRouter.js
 * Routes non-command interactions (buttons, modals, select menus) to their handlers.
 */
const { PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db          = require('../utils/database');
const ticketLogic = require('../utils/ticketLogic');
const { verifyMessage, REDDIT_REGEX, LOADING_EMOJI, CHECK_EMOJI } = require('../commands/admin/verify');

async function handleButton(interaction) {
    const { customId } = interaction;

    // ── Ticket Panel Open ──────────────────────────────────────────────────────
    if (customId.startsWith('ticket_open_')) {
        const categoryId = customId.replace('ticket_open_', '');
        const category   = db.getCategory(categoryId);
        if (!category) return interaction.reply({ content: 'Invalid category!', ephemeral: true });

        if (db.isBlacklisted(interaction.guildId, interaction.user.id)) {
            return interaction.reply({ content: 'You are blacklisted from opening tickets.', ephemeral: true });
        }

        const config      = db.getGuildConfig(interaction.guildId);
        const staffRoles  = JSON.parse(category.roles || '[]');
        const isAdmin     = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                            (config.adminRoleId && interaction.member.roles.cache.has(config.adminRoleId));
        const isSupport   = staffRoles.some(r => interaction.member.roles.cache.has(r));

        const active = db.getUserActiveTickets(interaction.user.id, interaction.guildId);
        if (active.length >= category.maxTickets && !isAdmin && !isSupport) {
            return interaction.reply({
                content: `You already have ${active.length} open ticket(s) in this category. Please wait for it to be resolved.`,
                ephemeral: true,
            });
        }

        const questions = JSON.parse(category.questions || '[]');
        if (questions.length > 0) {
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${categoryId}`)
                .setTitle(`${category.name} — Details`);

            questions.forEach((q, i) => {
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId(`question_${i}`)
                            .setLabel(q.label)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );
            });

            return interaction.showModal(modal);
        }

        return ticketLogic.createTicket(interaction, category, {});
    }

    // ── Ticket Management ─────────────────────────────────────────────────────
    switch (customId) {
        case 'ticket_claim':
            return ticketLogic.claimTicket(interaction);
        case 'ticket_close_prompt':
            return ticketLogic.closePrompt(interaction);
        case 'ticket_close_confirm':
            return ticketLogic.closeTicket(interaction);
        case 'ticket_close_cancel':
            return interaction.update({ content: 'Close cancelled. 🌸', components: [] });
        case 'ticket_manage_users':
            return ticketLogic.manageUsers(interaction);
    }
}

async function handleModal(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('ticket_modal_')) {
        const categoryId = customId.replace('ticket_modal_', '');
        const category   = db.getCategory(categoryId);
        if (!category) return interaction.reply({ content: 'Category not found.', ephemeral: true });

        const questions = JSON.parse(category.questions || '[]');
        const answers   = Object.fromEntries(
            questions.map((q, i) => [q.label, interaction.fields.getTextInputValue(`question_${i}`)])
        );

        return ticketLogic.createTicket(interaction, category, answers);
    }
}

async function handleSelectMenu(interaction) {
    if (interaction.customId === 'ticket_user_select') {
        return ticketLogic.handleUserUpdate(interaction);
    }
}

async function handleContextMenu(interaction) {
    if (interaction.commandName === 'Verify Link') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only Administrators can verify links! 🎀', ephemeral: true });
        }

        const message = interaction.targetMessage;
        if (!REDDIT_REGEX.test(message.content)) {
            return interaction.reply({ content: "I couldn't find a Reddit link in that message! 🍭", ephemeral: true });
        }

        return verifyMessage(interaction, message);
    }
}

module.exports = { handleButton, handleModal, handleSelectMenu, handleContextMenu };
