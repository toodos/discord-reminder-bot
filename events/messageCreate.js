/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels.
 */
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const { REDDIT_REGEX, LOADING_EMOJI } = require('../commands/admin/verify');
// No more Groq SDK needed! Using native fetch for Pollinations AI.
const { aiToolDefinitions, executeTool } = require('../utils/aiTools');

const URL_REGEX = /https?:\/\/[^\s]+/;

const OPENROUTER_MODELS = [
    'google/gemini-2.0-flash-lite-preview-02-05:free', // Extremely fast
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free'
];

const POLLINATIONS_MODELS = [
    'qwen-safety', // Requested by user (Qwen3Guard 8B)
    'openai',      // GPT-4o-ish
    'mistral'      // Stable fallback
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
                memberPermissions: message.member?.permissions || null,
                guild: message.guild,
                guildId: message.guild?.id || null,
                channel: message.channel,
                channelId: message.channel.id,
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
                        const vals = args.join(' ').match(/-?\b\d+(?:\.\d+)?\b/g) || [];
                        const val = vals[0];
                        if (val) { args = args.filter(a => !a.includes(val)); return parseInt(val); }
                        return null;
                    },
                    getNumber: () => {
                        const vals = args.join(' ').match(/-?\b\d+(?:\.\d+)?\b/g) || [];
                        const val = vals[0];
                        if (val) { args = args.filter(a => !a.includes(val)); return parseFloat(val); }
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

    // ----- TICKET LINK CHECKER (Moved up so it runs instantly) -----
    if (!isDM) {
        const ticket = db.getTicket(message.channel.id);
        if (ticket) {
            const config  = db.getGuildConfig(message.guild.id);
            const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                            (config.adminRoleId && message.member.roles.cache.has(config.adminRoleId));
            if (!isAdmin) {
                const urlMatch = message.content.match(URL_REGEX);
                if (urlMatch) {
                    try {
                        if (REDDIT_REGEX.test(urlMatch[0])) await message.react(LOADING_EMOJI);
                        else await message.react('✅');
                    } catch (err) { }
                }
            }
        }
    }

    if (isChatRequest) {
        if (!process.env.OPENROUTER_API_KEY && !process.env.POLLINATIONS_API_KEY) {
            return message.reply("I am not configured with any AI API keys! Please set `OPENROUTER_API_KEY` or `POLLINATIONS_API_KEY` in the `.env` file.").catch(() => {});
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
                                    args: { type: 'string', description: 'The FULL text arguments you want to pass to the command (e.g., "75 <@123456789>" or "category name")' }
                                }
                            }
                        }
                    });
                }
            }

            const providers = [];
            if (process.env.OPENROUTER_API_KEY) providers.push({
                name: 'OpenRouter',
                endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                key: process.env.OPENROUTER_API_KEY,
                models: OPENROUTER_MODELS,
                headers: {
                    'HTTP-Referer': 'https://github.com/toodos/discord-reminder-bot',
                    'X-Title': 'Oakawol Bot'
                }
            });
            if (process.env.POLLINATIONS_API_KEY) providers.push({
                name: 'Pollinations',
                endpoint: 'https://gen.pollinations.ai/v1/chat/completions',
                key: process.env.POLLINATIONS_API_KEY,
                models: POLLINATIONS_MODELS,
                headers: {}
            });

            for (const provider of providers) {
                for (const model of provider.models) {
                    try {
                        const messages = [
                            { role: 'system', content: 'You are an autonomous AI Discord agent named Oakawol Bot. Note: users will tag people as <@123456789>, extract the 123456789 part to use as userId. If a tool fails to find what the user asked for, you MUST use your own internal AI knowledge to try answering anyway. Answer concisely. IMPORTANT: When using tools, you MUST return a valid JSON tool_call object. DO NOT output your own tags or raw text before the tool call. ONLY use tools explicitly provided in this request.' },
                            { role: 'user', content: prompt }
                        ];

                        // API call
                        const response = await fetch(provider.endpoint, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${provider.key}`,
                                ...provider.headers
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: messages,
                                tools: dynamicTools,
                                tool_choice: 'auto'
                            })
                        });
                        
                        if (!response.ok) {
                            const errBody = await response.text();
                            throw new Error(`${provider.name} API failed (${model}): ${response.status} ${errBody}`);
                        }
                        
                        const completion = await response.json();
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
                                            memberPermissions: message.member?.permissions || null,
                                            guild: message.guild,
                                            guildId: message.guild?.id || null,
                                            channel: message.channel,
                                            channelId: message.channel.id,
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
                                                getString: (name) => {
                                                    if (name === 'time') {
                                                        const match = (argsObj.args || '').match(/\b(?:\d+[smhd])+\b/i);
                                                        if (match) {
                                                            argsObj.args = argsObj.args.replace(match[0], '').trim();
                                                            return match[0];
                                                        }
                                                    }
                                                    if (['prompt', 'message', 'description', 'title'].includes(name)) {
                                                        const res = argsObj.args;
                                                        argsObj.args = '';
                                                        return res || null;
                                                    }
                                                    const argArr = argsObj.args ? argsObj.args.split(' ') : [];
                                                    const res = argArr.shift();
                                                    argsObj.args = argArr.join(' ');
                                                    return res || null;
                                                },
                                                getUser: () => {
                                                    const matches = [...(argsObj.args || '').matchAll(/(?:<@!?)?(\d{17,20})>?/g)];
                                                    for (const match of matches) {
                                                        const user = message.client.users.cache.get(match[1]) || message.guild?.members.cache.get(match[1])?.user;
                                                        if (user) {
                                                            argsObj.args = argsObj.args.replace(match[0], '');
                                                            return user;
                                                        }
                                                    }
                                                    return null;
                                                },
                                                getChannel: () => {
                                                    const matches = [...(argsObj.args || '').matchAll(/<#(\d+)>/g)];
                                                    for (const match of matches) {
                                                        const channel = message.guild?.channels.cache.get(match[1]);
                                                        if (channel) {
                                                            argsObj.args = argsObj.args.replace(match[0], '');
                                                            return channel;
                                                        }
                                                    }
                                                    return null;
                                                },
                                                getRole: () => null,
                                                getInteger: () => {
                                                    const vals = (argsObj.args || '').match(/-?\b\d+(?:\.\d+)?\b/g) || [];
                                                    const val = vals[0];
                                                    if (val) { argsObj.args = argsObj.args.replace(val, ''); return parseInt(val); }
                                                    return null;
                                                },
                                                getNumber: () => {
                                                    const vals = (argsObj.args || '').match(/-?\b\d+(?:\.\d+)?\b/g) || [];
                                                    const val = vals[0];
                                                    if (val) { argsObj.args = argsObj.args.replace(val, ''); return parseFloat(val); }
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
                            
                            const secondResponse = await fetch(provider.endpoint, {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${provider.key}`,
                                    ...provider.headers
                                },
                                body: JSON.stringify({
                                    model: model,
                                    messages: messages
                                })
                            });
                            
                            if (!secondResponse.ok) {
                                throw new Error(`${provider.name} API second call failed: ${secondResponse.status}`);
                            }
                            
                            const secondCompletion = await secondResponse.json();
                            reply = secondCompletion.choices[0]?.message?.content;
                            if (executedSilently && (!reply || reply.trim() === '')) {
                                reply = "COMMAND_EXECUTED_SILENTLY";
                            }
                        } else if (responseMessage?.content) {
                            reply = responseMessage.content;
                        }

                        if (reply) break;
                    } catch (err) {
                        console.error(`[${provider.name} Error] Model ${model} failed:`, err.message);
                        // Add a tiny delay to give the next choice a chance
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
                if (reply) break;
            }


            if (!reply) {
                return; // Suppress missing api error since it processes every msg
            }

            if (reply === "COMMAND_EXECUTED_SILENTLY" || reply.trim().toUpperCase() === "IGNORE") return;

            if (reply.length > 2000) {
                reply = reply.substring(0, 1997) + '...';
            }
            return message.reply(reply).catch(() => {});
        } catch (error) {
            console.error('[AI Unexpected Error]', error);
        }
    }
};
