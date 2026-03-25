/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels.
 */
const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const { REDDIT_REGEX, LOADING_EMOJI } = require('../commands/admin/verify');
const Groq = require('groq-sdk');

let groqClient = null;
if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const URL_REGEX = /https?:\/\/[^\s]+/;

const GROQ_MODELS = [
    'moonshotai/kimi-k2-instruct-0905',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'llama-3.3-70b-versatile'
];

module.exports = async function onMessageCreate(message) {
    if (message.author.bot) return;

    const isDM = !message.guild;
    const isChatRequest = isDM || message.mentions.has(message.client.user);

    if (isChatRequest) {
        if (!groqClient) {
            if (process.env.GROQ_API_KEY) {
                groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
            } else {
                return message.reply("I am not configured with a Groq API key yet! Please set `GROQ_API_KEY` in the `.env` file.").catch(() => {});
            }
        }

        const prompt = message.content.replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '').trim();

        if (!prompt) {
            return message.reply("Hello! How can I help you today? 🌸").catch(() => {});
        }

        try {
            await message.channel.sendTyping();
            let reply = null;

            for (const model of GROQ_MODELS) {
                try {
                    const completion = await groqClient.chat.completions.create({
                        messages: [
                            { role: 'system', content: 'You are a helpful and friendly Discord chatbot named Oakawol Bot. Keep your answers concise to fit within Discord message limits.' },
                            { role: 'user', content: prompt }
                        ],
                        model: model,
                    });
                    reply = completion.choices[0]?.message?.content;
                    if (reply) break;
                } catch (apiError) {
                    console.error(`[Groq Error] Model ${model} failed:`, apiError.message);
                }
            }

            if (!reply) {
                return message.reply("Oops, all my AI models are currently down! Please try again later. 🧊").catch(() => {});
            }

            if (reply.length > 2000) {
                reply = reply.substring(0, 1997) + '...';
            }
            return message.reply(reply).catch(() => {});
        } catch (error) {
            console.error('[Groq Unexpected Error]', error);
            return message.reply("Oops, I encountered an unexpected error while thinking! 🧊").catch(() => {});
        }
    }

    if (isDM) return;

    const ticket = db.getTicket(message.channel.id);
    if (!ticket) return;

    const config  = db.getGuildConfig(message.guild.id);
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    (config.adminRoleId && message.member.roles.cache.has(config.adminRoleId));
    if (isAdmin) return;

    const urlMatch = message.content.match(URL_REGEX);
    if (!urlMatch) return;

    const url = urlMatch[0];

    try {
        if (REDDIT_REGEX.test(url)) {
            await message.react(LOADING_EMOJI);
        } else {
            await message.react('✅');
        }
    } catch (err) {
        console.error('[LinkCheck] Failed to react:', err.message);
    }
};
