/**
 * events/messageCreate.js
 * Handles link detection inside ticket channels and AI chat via Pollinations.
 */
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const db = require("../utils/database");
const { REDDIT_REGEX, LOADING_EMOJI } = require("../commands/admin/verify");
const { aiToolDefinitions, executeTool } = require("../utils/aiTools");

const URL_REGEX = /https?:\/\/[^\s]+/;

// Primary: openai (most stable, full tool support)
// claude-fast: fast Claude, great tool support
// mistral: reliable European fallback
// gemini-fast: capable but prone to 502 gateway errors — kept as late fallback
// qwen-safety: text-only guard model, absolute last resort
const POLLINATIONS_MODELS = [
  { model: "openai", supportsTools: true }, // GPT-4o class — primary
  { model: "claude-fast", supportsTools: true }, // Claude Haiku — fast & reliable
  { model: "mistral", supportsTools: true }, // Mistral — solid fallback
  { model: "gemini-fast", supportsTools: true }, // Gemini Flash — flaky, last tool attempt
  { model: "qwen-safety", supportsTools: false }, // text-only guard — absolute last resort
];

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
      const isAdmin =
        message.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRoleId &&
          message.member.roles.cache.has(config.adminRoleId));
      if (!isAdmin) {
        const urlMatch = message.content.match(URL_REGEX);
        if (urlMatch) {
          try {
            if (REDDIT_REGEX.test(urlMatch[0]))
              await message.react(LOADING_EMOJI);
            else await message.react("✅");
          } catch (err) {}
        }
      }
    }
  }

  if (!isChatRequest) return;

  // ----- AI CHAT HANDLER (Pollinations Only) -----
  if (!process.env.POLLINATIONS_API_KEY) {
    return message
      .reply(
        "I'm not configured with a Pollinations API key! Please set `POLLINATIONS_API_KEY` in the `.env` file.",
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

  try {
    await message.channel.sendTyping();
    let reply = null;

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

    for (const { model, supportsTools } of POLLINATIONS_MODELS) {
      try {
        const messages = [
          {
            role: "system",
            content: `You are Oakawol Bot, a helpful Discord server assistant. Always use the tools provided — never refuse an action if a matching tool exists.

Available bot commands (use via cmd_ tools):
- cmd_add_money / cmd_remove_money: Manage a user's server balance. Pass args as "<number> <userId>"
- cmd_balance: View a user's balance. Pass args as "<userId>"
- cmd_imagine: Create AI art. Pass args as the image description.
- cmd_remind: Schedule a reminder. Pass args as "<duration> <note>" (e.g. "10m check oven")

Always extract the user's Discord ID from mentions like <@123456789> and include it in args.
Reply concisely and friendly. Do not include any reasoning or thinking in your response.`,
          },
          { role: "user", content: prompt },
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

        const response = await fetch(
          "https://gen.pollinations.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errBody = await response.text();
          const is5xx = response.status >= 500 && response.status < 600;
          const err = new Error(
            `Pollinations API failed (${model}): ${response.status} ${errBody}`,
          );
          // Log 5xx as a quiet warning — these are transient upstream issues, not bugs
          if (is5xx) {
            console.warn(
              `[Pollinations] ⚠️  Model ${model} returned ${response.status} (gateway issue) — trying next model...`,
            );
          } else {
            console.error(
              `[Pollinations] ❌ Model ${model} returned ${response.status} — trying next model...`,
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
            const argsObj = JSON.parse(toolCall.function.arguments);
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
            // Second API call to get final text response after tool execution
            const secondResponse = await fetch(
              "https://gen.pollinations.ai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
                },
                body: JSON.stringify({ model: model, messages: messages }),
              },
            );

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
                `[Pollinations] Second call failed (${model}): ${secondResponse.status} — tools already ran, using fallback reply`,
              );
            }
          } catch (secondErr) {
            console.warn(
              `[Pollinations] Second call error (${model}):`,
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
        // Only log unexpected errors here — 5xx gateway errors are already warned above
        if (!err.message.includes("Pollinations API failed")) {
          console.error(
            `[Pollinations] ❌ Unexpected error with model ${model}:`,
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
