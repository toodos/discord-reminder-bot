const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'imagine',
    description: 'Generate a beautiful image from a prompt 🎨✨',
    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        if (!prompt) {
            return interaction.reply({ content: 'You need to tell me what to imagine! 🌸', ephemeral: true });
        }

        // Send a typing indicator while generating
        if (interaction.deferReply) {
            await interaction.deferReply();
        } else if (interaction.channel && interaction.channel.sendTyping) {
            await interaction.channel.sendTyping();
        }

        try {
            // Pollinations.ai generates images strictly via URL. We fetch it as an ArrayBuffer to send as attachment.
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch image');

            const buffer = await response.arrayBuffer();
            const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'imagine.jpeg' });

            const payload = { 
                content: `🎨 **Imagined:** *${prompt}*`,
                files: [attachment] 
            };

            if (interaction.editReply) {
                await interaction.editReply(payload);
            } else {
                await interaction.reply(payload);
            }
        } catch (error) {
            console.error('[Imagine Error]', error);
            const errorPayload = { content: 'Oops! I had trouble imagining that. 🧊💦' };
            if (interaction.editReply) {
                await interaction.editReply(errorPayload);
            } else {
                await interaction.reply(errorPayload);
            }
        }
    },
};
