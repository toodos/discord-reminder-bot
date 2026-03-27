/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels.
 */
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const { REDDIT_REGEX, LOADING_EMOJI } = require('../commands/admin/verify');
const Groq = require('groq-sdk');
const { aiToolDefinitions, executeTool } = require('../utils/aiTools');

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

    // ----- PREFIX COMMAND HANDLER -----
    const prefix = '!';
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.commands?.get(commandName);
        if (command) {
            const mockInteraction = {
                client: message.client,
                user: message.author,
                member: message.member,
                memberPermissions: message.member.permissions,
                guild: message.guild,
                channel: message.channel,
                commandName: commandName,
                isChatInputCommand: () => true,
                deferReply: async () => { await message.channel.sendTyping(); },
                reply: async (data) => { 
                    if (typeof data === 'string') return message.reply(data);
                    return message.reply(data); 
                },
                editReply: async (data) => message.channel.send(data),
                followUp: async (data) => message.channel.send(data),
                options: {
                    getString: (name) => {
                        if (['prompt', 'message', 'description', 'title'].includes(name)) {
                            const res = args.join(' ');
                            args.length = 0;
                            return res || null;
                        }
                        return args.shift() || null;
                    },
                    getUser: (name) => {
                        if (!args[0]) return null;
                        const match = args[0].match(/(?:<@!?)?(\d{17,20})>?/);
                        if (match) {
                            args.shift();
                            return message.client.users.cache.get(match[1]) || null;
                        }
                        return null;
                    },
                    getChannel: (name) => {
                        if (!args[0]) return null;
                        const match = args[0].match(/<#(\d+)>/);
                        if (match) {
                            args.shift();
                            return message.guild?.channels.cache.get(match[1]) || null;
                        }
                        return null;
                    },
                    getRole: () => null,
                    getInteger: () => {
                        const val = args.find(a => a && !isNaN(a) && !a.startsWith('<'));
                        if (val) { args.splice(args.indexOf(val), 1); return parseInt(val); }
                        return null;
                    },
                    getNumber: () => {
                        const val = args.find(a => a && !isNaN(a) && !a.startsWith('<'));
                        if (val) { args.splice(args.indexOf(val), 1); return parseFloat(val); }
                        return null;
                    },
                    getBoolean: () => null,
                }
            };

            try {
                await command.execute(mockInteraction);
                return;
            } catch (error) {
                console.error(`[Prefix Error] Error executing ${commandName}:`, error);
                message.reply('Oops! There was an error executing that command. 🧊').catch(() => {});
                return;
            }
        }
    }

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

            const dynamicTools = [ ...aiToolDefinitions ];

            if (message.client.commands) {
                for (const [cmdName, cmd] of message.client.commands.entries()) {
                    dynamicTools.push({
                        type: 'function',
                        function: {
                            name: `cmd_${cmdName.replace(/[^a-zA-Z0-9_-]/g, '')}`,
                            description: `Executes the built-in bot command '${cmdName}'. Description: ${cmd.description || 'No description'}`,
                            parameters: {
                                type: 'object',
                                properties: {
                                    args: { type: 'string', description: 'Any text arguments the command might need' }
                                }
                            }
                        }
                    });
                }
            }

            for (const model of GROQ_MODELS) {
                try {
                    const messages = [
                        { role: 'system', content: 'You are a helpful, powerful Discord chatbot named Oakawol Bot. You have massive tools. Note: for IDs, users will tag people, which look like <@123456789>, you must extract the 123456789 part to use as userId. If a tool fails to find what the user asked for (e.g. dictionary or web search fails), you MUST use your own internal AI knowledge to try answering the user anyway. Answer concisely.' },
                        { role: 'user', content: prompt }
                    ];

                    const completion = await groqClient.chat.completions.create({
                        messages: messages,
                        model: model,
                        tools: dynamicTools,
                        tool_choice: 'auto'
                    });
                    
                    const responseMessage = completion.choices[0]?.message;
                    
                    if (responseMessage?.tool_calls) {
                        messages.push(responseMessage);
                        
                        let executedSilently = false;

                        for (const toolCall of responseMessage.tool_calls) {
                            const argsObj = JSON.parse(toolCall.function.arguments);
                            const tName = toolCall.function.name;
                            let toolResult = "";
                            
                            if (tName.startsWith('cmd_')) {
                                const cmdName = tName.replace('cmd_', '');
                                const command = message.client.commands?.get(cmdName);
                                if (command) {
                                    const mockArgs = (argsObj.args || '').split(' ');
                                    let commandReplied = false;
                                    const mockInteraction = {
                                        client: message.client,
                                        user: message.author,
                                        member: message.member,
                                        memberPermissions: message.member.permissions,
                                        guild: message.guild,
                                        channel: message.channel,
                                        commandName: cmdName,
                                        isChatInputCommand: () => true,
                                        deferReply: async () => { await message.channel.sendTyping(); },
                                        reply: async (data) => { 
                                            commandReplied = true;
                                            return message.reply(data); 
                                        },
                                        editReply: async (data) => {
                                            commandReplied = true;
                                            return message.channel.send(data);
                                        },
                                        followUp: async (data) => {
                                            commandReplied = true;
                                            return message.channel.send(data);
                                        },
                                        options: {
                                            getString: () => argsObj.args || null,
                                            getUser: () => {
                                                const match = (argsObj.args || '').match(/(?:<@!?)?(\d{17,20})>?/);
                                                return match ? message.client.users.cache.get(match[1]) || null : null;
                                            },
                                            getChannel: () => null,
                                            getRole: () => null,
                                            getInteger: () => {
                                                const val = mockArgs.find(a => a && !isNaN(a) && !a.startsWith('<'));
                                                if (val) { mockArgs.splice(mockArgs.indexOf(val), 1); return parseInt(val); }
                                                return null;
                                            },
                                            getNumber: () => {
                                                const val = mockArgs.find(a => a && !isNaN(a) && !a.startsWith('<'));
                                                if (val) { mockArgs.splice(mockArgs.indexOf(val), 1); return parseFloat(val); }
                                                return null;
                                            },
                                            getBoolean: () => null,
                                        }
                                    };
                                    try {
                                        await command.execute(mockInteraction);
                                        if (commandReplied) executedSilently = true;
                                        toolResult = commandReplied ? "SYSTEM NOTE: The command was successfully executed and the results were directly shown to the user in the channel. You DO NOT need to answer the prompt yourself, just briefly acknowledge it was done (like 'Done!' or 'Here you go!'), or say nothing." : "I executed the command for you! 🌸";
                                    } catch (err) {
                                        console.error(`[AI Cmd Error]`, err);
                                        toolResult = `Error executing internal command! 🧊`;
                                    }
                                } else {
                                    toolResult = "Command not found.";
                                }
                            } else {
                                toolResult = await executeTool(tName, argsObj, message);
                            }
                            
                            messages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                name: tName,
                                content: String(toolResult)
                            });
                        }
                        
                        const secondCompletion = await groqClient.chat.completions.create({
                            messages: messages,
                            model: model
                        });
                        
                        reply = secondCompletion.choices[0]?.message?.content;
                        if (executedSilently && (!reply || reply.trim() === '')) {
                            reply = "COMMAND_EXECUTED_SILENTLY";
                        }
                        if (reply) break;
                    } else if (responseMessage?.content) {
                        reply = responseMessage.content;
                        if (reply) break;
                    }
                } catch (apiError) {
                    console.error(`[Groq Error] Model ${model} failed:`, apiError.message);
                }
            }

            if (!reply) {
                return message.reply("Oops, all my AI models are currently down! Please try again later. 🧊").catch(() => {});
            }

            if (reply === "COMMAND_EXECUTED_SILENTLY") return;

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
