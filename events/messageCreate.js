/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels and AI chat.
 * Primary engine: Pollinations  |  Fallback: None (multi-model)  |  Images: Pollinations
 */
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const db = require("../utils/database");
const { REDDIT_REGEX, LOADING_EMOJI, CHECK_EMOJI } = require("../commands/admin/verify");
const { aiToolDefinitions, executeTool } = require("../utils/aiTools");

const URL_REGEX = /https?:\/\/[^\s]+/;

async function verifyLinkStatus(url) {
  try {
    // Check for Discord Invite links
    const inviteMatch = url.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9\-]+\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9\-]+)/i);
    if (inviteMatch) {
      const inviteCode = inviteMatch[1];
      const inviteRes = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`).catch(() => null);
      if (!inviteRes || !inviteRes.ok) {
        return { working: false, reason: 'Invalid or expired Discord invite.' };
      }
      return { working: true, isInvite: true };
    }

    // Check for YouTube links
    const youtubeMatch = url.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9\-]+\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9\-_]+)/i);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`).catch(() => null);
      if (!oembedRes || !oembedRes.ok) {
        return { working: false, reason: 'Video not found or private.' };
      }
      return { working: true, isYouTube: true };
    }

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      return { working: false, reason: `HTTP status ${response.status}` };
    }
    
    const finalUrl = response.url;
    
    const isReddit = /reddit\.com|redd\.it/i.test(finalUrl);
    if (!isReddit) {
      return { working: true, isReddit: false };
    }
    
    const urlObj = new URL(finalUrl);
    urlObj.search = '';
    let jsonUrl = urlObj.toString();
    if (!jsonUrl.endsWith('.json')) {
      if (jsonUrl.endsWith('/')) {
        jsonUrl = jsonUrl.slice(0, -1) + '.json';
      } else {
        jsonUrl = jsonUrl + '.json';
      }
    }
    
    const jsonRes = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!jsonRes.ok) {
      return { working: true, isReddit: true, removed: false };
    }
    
    const data = await jsonRes.json();
    const commentMatch = finalUrl.match(/\/comments\/[a-z0-9]+\/[^\/]+\/([a-z0-9]+)/i) || 
                        finalUrl.match(/\/comments\/[a-z0-9]+\/_\/([a-z0-9]+)/i);
    const commentId = commentMatch ? commentMatch[1] : null;
    
    let isRemoved = false;
    
    if (commentId) {
      let targetComment = null;
      
      function findComment(node, targetId) {
        if (!node) return null;
        if (node.kind === 't1' && node.data && node.data.id === targetId) {
          return node.data;
        }
        if (node.data && node.data.replies && node.data.replies.data && node.data.replies.data.children) {
          for (const child of node.data.replies.data.children) {
            const found = findComment(child, targetId);
            if (found) return found;
          }
        }
        return null;
      }
      
      if (Array.isArray(data) && data[1]?.data?.children) {
        for (const child of data[1].data.children) {
          targetComment = findComment(child, commentId);
          if (targetComment) break;
        }
      }
      
      if (targetComment) {
        isRemoved = targetComment.body === '[removed]' || 
                    targetComment.body === '[deleted]' || 
                    targetComment.author === '[deleted]';
      } else {
        isRemoved = true;
      }
    } else {
      const post = data[0]?.data?.children?.[0]?.data;
      if (post) {
        isRemoved = post.selftext === '[removed]' || 
                    post.selftext === '[deleted]' || 
                    !!post.removed_by_category;
      }
    }
    
    return { working: true, isReddit: true, removed: isRemoved };
  } catch (error) {
    console.error('[verifyLinkStatus] Error checking link:', error);
    return { working: false, reason: error.message };
  }
}

// Provider configurations and failover model hierarchy
const AI_MODELS = [
  { provider: "groq",       model: "llama-3.3-70b-versatile",          supportsTools: true  },
  { provider: "cerebras",   model: "llama-3.3-70b",                   supportsTools: false },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", supportsTools: true  },
  { provider: "openrouter", model: "anthropic/claude-3.5-sonnet",       supportsTools: true  },
  { provider: "pollinations", model: "openai-fast",                      supportsTools: true  },
];

function getProviderConfig(provider) {
  if (provider === "pollinations") {
    return {
      url: "https://gen.pollinations.ai/v1/chat/completions",
      key: process.env.POLLINATIONS_API_KEY,
    };
  }
  if (provider === "groq") {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
    };
  }
  if (provider === "cerebras") {
    return {
      url: "https://api.cerebras.ai/v1/chat/completions",
      key: process.env.CEREBRAS_API_KEY,
    };
  }
  if (provider === "openrouter") {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: process.env.OPENROUTER_API_KEY,
    };
  }
  return { url: null, key: null };
}

module.exports = async function onMessageCreate(message) {
  if (message.author.bot) return;

  // ----- PREFIX COMMAND HANDLER -----
  const prefix = "!";
  if (message.content.startsWith(prefix)) {
    let args = message.content.slice(prefix.length).trim().split(/ +/);
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
        deferReply: async () => {
          await message.channel.sendTyping();
        },
        reply: async (data) => {
          if (typeof data === "string") return message.reply(data);
          return message.reply(data);
        },
        editReply: async (data) => message.channel.send(data),
        followUp: async (data) => message.channel.send(data),
        options: {
          getSubcommand: () => {
            if (args.length > 0) {
              return args.shift().toLowerCase();
            }
            return null;
          },
          getString: (name) => {
            if (["prompt", "message", "description", "title"].includes(name)) {
              const res = args.join(" ");
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
            const vals = args.join(" ").match(/-?\b\d+(?:\.\d+)?\b/g) || [];
            const val = vals[0];
            if (val) {
              args = args.filter((a) => !a.includes(val));
              return parseInt(val);
            }
            return null;
          },
          getNumber: () => {
            const vals = args.join(" ").match(/-?\b\d+(?:\.\d+)?\b/g) || [];
            const val = vals[0];
            if (val) {
              args = args.filter((a) => !a.includes(val));
              return parseFloat(val);
            }
            return null;
          },
          getBoolean: () => null,
        },
      };

      try {
        await command.execute(mockInteraction);
        return;
      } catch (error) {
        console.error(`[Prefix Error] Error executing ${commandName}:`, error);
        message
          .reply("Oops! There was an error executing that command. 🧊")
          .catch(() => {});
        return;
      }
    }
  }

  const isDM = !message.guild;
  const isChatRequest = isDM || message.mentions.has(message.client.user);

  // ----- TICKET LINK CHECKER -----
  if (!isDM) {
    const ticket = db.getTicket(message.channel.id);
    if (ticket) {
      const config = db.getGuildConfig(message.guild.id);
      const isAdmin = message.member && (
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRoleId &&
          message.member.roles.cache.has(config.adminRoleId))
      );
      if (!isAdmin) {
        const urlMatch = message.content.match(URL_REGEX);
        if (urlMatch) {
          (async () => {
            const url = urlMatch[0];
            try {
              // React with loading icon
              await message.react(LOADING_EMOJI).catch(() => {});
              
              // Verify the link status
              const result = await verifyLinkStatus(url);
              
              // Remove the loading reaction
              const loadingReaction = message.reactions.cache.get(LOADING_EMOJI);
              if (loadingReaction) {
                await loadingReaction.users.remove(message.client.user.id).catch(() => {});
              }
              
              if (result.working && (!result.isReddit || !result.removed)) {
                // React with check mark with 8 second delay
                setTimeout(() => {
                  message.react(CHECK_EMOJI).catch(() => {});
                }, 8000);
              } else {
                // React with cross mark
                await message.react('❌').catch(() => {});
              }
            } catch (err) {
              console.error('[Ticket Link Checker Error]', err);
              const loadingReaction = message.reactions.cache.get(LOADING_EMOJI);
              if (loadingReaction) {
                await loadingReaction.users.remove(message.client.user.id).catch(() => {});
              }
              await message.react('❌').catch(() => {});
            }
          })();
        }
      }
    }
  }

  if (!isChatRequest) return;

  // ----- AI CHAT HANDLER (Pollinations only) -----
  if (!process.env.POLLINATIONS_API_KEY) {
    return message
      .reply(
        "I'm not configured with a Pollinations AI API key! Please set `POLLINATIONS_API_KEY` in the `.env` file.",
      )
      .catch(() => {});
  }

  const prompt = message.content
    .replace(new RegExp(`<@!?${message.client.user.id}>`, "g"), "")
    .trim();

  if (!prompt) {
    return message.reply("Hello! How can I help you today? 🌸").catch(() => {});
  }

  // Signal bot is busy → DND
  if (message.client.setActivity) message.client.setActivity(true);

  // Fetch conversation history for context
  let conversationHistory = [];
  try {
    const fetched = await message.channel.messages.fetch({ limit: 30 });
    
    Array.from(fetched.values()).forEach(msg => {
      if (msg.id === message.id) return;
      if (!msg.content) return;
      if (msg.content.startsWith("!")) return;
      
      let textContent = msg.content.replace(new RegExp(`<@!?${message.client.user.id}>`, "g"), "").trim();
      if (!textContent) return;
      
      if (msg.author.id === message.client.user.id) {
        conversationHistory.unshift({ role: "assistant", content: textContent });
      } else {
        conversationHistory.unshift({ role: "user", content: `${msg.author.username}: ${textContent}` });
      }
    });

    if (conversationHistory.length > 25) {
      conversationHistory = conversationHistory.slice(conversationHistory.length - 25);
    }
  } catch (error) {
    console.warn("Could not fetch conversation history:", error);
  }

  try {
    await message.channel.sendTyping();
    let reply = null;

    // Fetch brain memories
    const brainMemories = db.getAllRelevantBrainMemories(message.author.id, message.guild?.id);
    let memoryPrompt = "";
    if (brainMemories && brainMemories.length > 0) {
      memoryPrompt = "\n\n--- LONG-TERM MEMORY (BRAIN) ---\n" + 
        brainMemories.map(m => {
          const scopeLabel = m.scope === 'user' ? `User ${message.author.username}` : (m.scope === 'server' ? 'Server' : 'Global');
          return `[${scopeLabel}]: ${m.content}`;
        }).join('\n') +
        "\n---------------------------------";
    }

    // Build tool list (built-in tools + bot slash commands)
    const dynamicTools = [...aiToolDefinitions];

    if (message.client.commands) {
      for (const [cmdName, cmd] of message.client.commands.entries()) {
        dynamicTools.push({
          type: "function",
          function: {
            name: `cmd_${cmdName.replace(/[^a-zA-Z0-9_-]/g, "")}`,
            description: `Executes the built-in bot command '${cmdName}'. Description: ${cmd.description || "No description"}`,
            parameters: {
              type: "object",
              properties: {
                args: {
                  type: "string",
                  description:
                    'The FULL text arguments for the command (e.g., "75 <@123456789>" or "category name")',
                },
              },
            },
          },
        });
      }
    }

    const availableModels = AI_MODELS.filter(
      ({ provider }) => !!getProviderConfig(provider).key,
    );

    for (const { provider, model, supportsTools } of availableModels) {
      const { url: apiUrl, key: apiKey } = getProviderConfig(provider);
      try {
        const messages = [
          {
            role: "system",
            content: `You are Oakawol Bot, a helpful Discord server assistant. Always use the tools provided — never refuse an action if a matching tool exists.${memoryPrompt}

Available bot commands (use via cmd_ tools):
- cmd_add_money / cmd_remove_money: Manage a user's server balance. Pass args as "<number> <userId>"
- cmd_balance: View a user's balance. Pass args as "<userId>"
- cmd_imagine: Create AI art. Pass args as the image description.
- cmd_remind: Schedule a reminder. Pass args as "<duration> <note>" (e.g. "10m check oven")

User messages are prefixed with their username (e.g. Username: message) so you know who is speaking.
Always extract the user's Discord ID from mentions like <@123456789> and include it in args.
Reply concisely and friendly. Do not include any reasoning or thinking in your response.`,
          },
          ...conversationHistory,
          { role: "user", content: `${message.author.username}: ${prompt}` },
        ];

        const requestBody = {
          model: model,
          messages: messages,
        };

        // Only pass tools to models that support them
        if (supportsTools) {
          requestBody.tools = dynamicTools;
          requestBody.tool_choice = "auto";
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        if (provider === "openrouter") {
          headers["HTTP-Referer"] = "https://github.com/toodos/discord-reminder-bot";
          headers["X-Title"] = "Oakawol Bot";
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errBody = await response.text();
          const is5xx = response.status >= 500 && response.status < 600;
          const providerTag = provider.charAt(0).toUpperCase() + provider.slice(1);
          const err = new Error(
            `${providerTag} API failed (${model}): ${response.status} ${errBody}`,
          );
          if (is5xx) {
            console.warn(
              `[${providerTag}] ⚠️  Model ${model} returned ${response.status} (gateway issue) — trying next model...`,
            );
          } else {
            console.error(
              `[${providerTag}] ❌ Model ${model} returned ${response.status} — trying next model...`,
            );
          }
          throw err;
        }

        const completion = await response.json();
        const responseMessage = completion.choices[0]?.message;

        if (responseMessage?.tool_calls) {
          messages.push(responseMessage);

          let executedSilently = false;

          for (const toolCall of responseMessage.tool_calls) {
            let argsObj;
            try {
              argsObj = JSON.parse(toolCall.function.arguments || "{}");
            } catch (err) {
              console.warn(`[AI Orchestrator] Failed to parse tool arguments:`, err.message);
              argsObj = {};
            }
            const tName = toolCall.function.name;
            let toolResult = "";

            if (tName.startsWith("cmd_")) {
              const cmdName = tName.replace("cmd_", "");
              const command = message.client.commands?.get(cmdName);
              if (command) {
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
                  deferReply: async () => {
                    await message.channel.sendTyping();
                  },
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
                    getSubcommand: () => {
                      if (argsObj.args) {
                        const argArr = argsObj.args.trim().split(/\s+/);
                        if (argArr.length > 0) {
                          const sub = argArr.shift().toLowerCase();
                          argsObj.args = argArr.join(" ");
                          return sub;
                        }
                      }
                      return null;
                    },
                    getString: (name) => {
                      if (name === "time") {
                        const match = (argsObj.args || "").match(
                          /\b(?:\d+[smhd])+\b/i,
                        );
                        if (match) {
                          argsObj.args = argsObj.args
                            .replace(match[0], "")
                            .trim();
                          return match[0];
                        }
                      }
                      if (
                        ["prompt", "message", "description", "title"].includes(
                          name,
                        )
                      ) {
                        const res = argsObj.args;
                        argsObj.args = "";
                        return res || null;
                      }
                      const argArr = argsObj.args
                        ? argsObj.args.split(" ")
                        : [];
                      const res = argArr.shift();
                      argsObj.args = argArr.join(" ");
                      return res || null;
                    },
                    getUser: () => {
                      const matches = [
                        ...(argsObj.args || "").matchAll(
                          /(?:<@!?)?(\d{17,20})>?/g,
                        ),
                      ];
                      for (const match of matches) {
                        const user =
                          message.client.users.cache.get(match[1]) ||
                          message.guild?.members.cache.get(match[1])?.user;
                        if (user) {
                          argsObj.args = argsObj.args.replace(match[0], "");
                          return user;
                        }
                      }
                      return null;
                    },
                    getChannel: () => {
                      const matches = [
                        ...(argsObj.args || "").matchAll(/<#(\d+)>/g),
                      ];
                      for (const match of matches) {
                        const channel = message.guild?.channels.cache.get(
                          match[1],
                        );
                        if (channel) {
                          argsObj.args = argsObj.args.replace(match[0], "");
                          return channel;
                        }
                      }
                      return null;
                    },
                    getRole: () => null,
                    getInteger: () => {
                      const vals =
                        (argsObj.args || "").match(/-?\b\d+(?:\.\d+)?\b/g) ||
                        [];
                      const val = vals[0];
                      if (val) {
                        argsObj.args = argsObj.args.replace(val, "");
                        return parseInt(val);
                      }
                      return null;
                    },
                    getNumber: () => {
                      const vals =
                        (argsObj.args || "").match(/-?\b\d+(?:\.\d+)?\b/g) ||
                        [];
                      const val = vals[0];
                      if (val) {
                        argsObj.args = argsObj.args.replace(val, "");
                        return parseFloat(val);
                      }
                      return null;
                    },
                    getBoolean: () => null,
                  },
                };
                try {
                  await command.execute(mockInteraction);
                  if (commandReplied) executedSilently = true;
                  toolResult = commandReplied
                    ? "SYSTEM NOTE: Command executed and shown to the user. Just briefly acknowledge it."
                    : "I executed the command for you! 🌸";
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
              role: "tool",
              tool_call_id: toolCall.id,
              name: tName,
              content: String(toolResult),
            });
          }

          // IMPORTANT: Tools were executed — we MUST break after this regardless of whether
          // the second call succeeds. If we don't, the next model will re-run the same tools!
          let secondReply = executedSilently
            ? "COMMAND_EXECUTED_SILENTLY"
            : null;

          try {
            const secondHeaders = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            };
            if (provider === "openrouter") {
              secondHeaders["HTTP-Referer"] = "https://github.com/toodos/discord-reminder-bot";
              secondHeaders["X-Title"] = "Oakawol Bot";
            }

            // Second API call to get final text response after tool execution
            const secondResponse = await fetch(apiUrl, {
              method: "POST",
              headers: secondHeaders,
              body: JSON.stringify({ model: model, messages: messages }),
            });

            const providerTag = provider.charAt(0).toUpperCase() + provider.slice(1);
            if (secondResponse.ok) {
              const secondCompletion = await secondResponse.json();
              let rawReply =
                secondCompletion.choices[0]?.message?.content || secondReply;
              // Strip reasoning tags from second call too
              if (rawReply) {
                rawReply = rawReply
                  .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
                  .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
                  .replace(/<output>([\s\S]*?)<\/output>/gi, "$1")
                  .trim();
              }
              secondReply = rawReply || secondReply;
            } else {
              console.warn(
                `[${providerTag}] Second call failed (${model}): ${secondResponse.status} — tools already ran, using fallback reply`,
              );
            }
          } catch (secondErr) {
            const providerTag = provider.charAt(0).toUpperCase() + provider.slice(1);
            console.warn(
              `[${providerTag}] Second call error (${model}):`,
              secondErr.message,
            );
          }

          // Set reply and ALWAYS break — tools already ran, do not retry with another model
          reply = secondReply || "Done! ✅";
          break;
        } else if (responseMessage?.content) {
          reply = responseMessage.content;
        }

        if (reply) break;
      } catch (err) {
        const providerTag = provider.charAt(0).toUpperCase() + provider.slice(1);
        const knownApiErr = err.message.includes("Pollinations API failed");
        if (!knownApiErr) {
          console.error(
            `[${providerTag}] ❌ Unexpected error with model ${model}:`,
            err.message,
          );
        }
        // Back off slightly longer for gateway errors to give upstream time to recover
        const isGatewayErr =
          err.message.includes("502") ||
          err.message.includes("503") ||
          err.message.includes("504");
        await new Promise((r) => setTimeout(r, isGatewayErr ? 1000 : 400));
      }
    }

    if (!reply) {
      if (message.client.setActivity) message.client.setActivity(false);
      return;
    }

    if (
      reply === "COMMAND_EXECUTED_SILENTLY" ||
      reply.trim().toUpperCase() === "IGNORE"
    ) {
      if (message.client.setActivity) message.client.setActivity(false);
      return;
    }

    // Strip reasoning model thinking tags (nova-fast, qwen, deepseek etc. leak these)
    reply = reply
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, "")
      .replace(/<output>([\s\S]*?)<\/output>/gi, "$1")
      .trim();

    if (!reply) {
      if (message.client.setActivity) message.client.setActivity(false);
      return;
    }

    if (reply.length > 2000) {
      reply = reply.substring(0, 1997) + "...";
    }
    const result = await message.reply(reply).catch(() => {});
    if (message.client.setActivity) message.client.setActivity(false);
    return result;
  } catch (error) {
    console.error("[AI Unexpected Error]", error);
    if (message.client.setActivity) message.client.setActivity(false);
  }
};
