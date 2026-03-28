const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'imagine',
    description: 'Generate a beautiful image from a prompt 🎨✨',
    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        if (!prompt) {
            return interaction.reply({ content: 'You need to tell me what to imagine! 🌸', ephemeral: true });
        }

        if (interaction.deferReply) {
            await interaction.deferReply();
        } else if (interaction.channel?.sendTyping) {
            await interaction.channel.sendTyping();
        }

        try {
            // Image generation is FREE on Pollinations - do NOT add an API key here
            // Adding a key with zero balance causes 401/402 errors
            const encodedPrompt = encodeURIComponent(prompt);
            const seed = Math.floor(Math.random() * 1000000);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image (${response.status} ${response.statusText})`);
            }

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
