/**
 * Ticket System Entry Point
 * Exports a loader function to initialize all ticket-related event listeners.
 */
const interactions = require('./events/interactions');

module.exports = (client) => {
    console.log('✨ Loading Ticket Module...');
    
    client.on('interactionCreate', async (interaction) => {
        try {
            await interactions(interaction, client);
        } catch (error) {
            console.error('❌ Error in Ticket Interaction Handler:', error);
        }
    });

    console.log('✅ Ticket Module Loaded!');
};
