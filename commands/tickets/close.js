/**
 * commands/tickets/close.js
 */
const ticketLogic = require('../../utils/ticketLogic');

module.exports = {
    name: 'close',
    description: 'Close an active ticket.',
    async execute(interaction) {
        await ticketLogic.closeTicket(interaction);
    },
};
