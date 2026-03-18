/**
 * commands/tickets/close.js
 */
const ticketLogic = require('../../utils/ticketLogic');

module.exports = {
    name: 'close',
    async execute(interaction) {
        await ticketLogic.closeTicket(interaction);
    },
};
