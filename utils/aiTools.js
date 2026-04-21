const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('./database');

const aiToolDefinitions = [
    // Moderation & Interaction
    {
        type: 'function',
        function: {
            name: 'react_to_recent_messages',
            description: 'Reacts to the most recent messages in the current channel with a specific emoji.',
            parameters: {
                type: 'object',
                properties: {
                    emoji: { type: 'string', description: 'The emoji to react with (e.g. ✅, 💀, 🔥, or a custom emoji string)' },
                    count: { type: 'integer', description: 'The number of recent messages to react to (default: 3, max: 20)' }
                },
                required: ['emoji']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_recent_messages',
            description: 'Deletes a specified number of recent messages in the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    count: { type: 'integer', description: 'The number of messages to delete (max 100)' }
                },
                required: ['count']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'timeout_user',
            description: 'Time out or mute a member in the server for a given number of minutes.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID (snowflake) of the person to timeout.' },
                    minutes: { type: 'integer', description: 'Duration in minutes to time them out (1 to 40320)' },
                    reason: { type: 'string', description: 'The reason for the timeout.' }
                },
                required: ['userId', 'minutes']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'kick_user',
            description: 'Kicks a member from the server.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID (snowflake) of the person to kick.' },
                    reason: { type: 'string', description: 'The reason for kicking the user.' }
                },
                required: ['userId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'ban_user',
            description: 'Bans a member from the server.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID of the person to ban.' },
                    reason: { type: 'string', description: 'Reason for the ban.' }
                },
                required: ['userId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'send_embed',
            description: 'Sends a beautifully styled embed message to the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'The title of the embed' },
                    description: { type: 'string', description: 'The main body/description of the embed' },
                    color: { type: 'string', description: 'A hex color code (e.g. #FF5733) or a standard color name like "Red"' }
                },
                required: ['title', 'description']
            }
        }
    },
    // Channel & Server Management
    {
        type: 'function',
        function: {
            name: 'lock_channel',
            description: 'Locks the current channel so regular members cannot send messages.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'unlock_channel',
            description: 'Unlocks the current channel so regular members can send messages again.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_channel',
            description: 'Creates a new text channel in the server.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'The name of the new channel' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'change_bot_nickname',
            description: 'Changes the bot\'s nickname in the server.',
            parameters: {
                type: 'object',
                properties: {
                    nickname: { type: 'string', description: 'The new nickname' }
                },
                required: ['nickname']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'set_slowmode',
            description: 'Sets the slowmode for the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    seconds: { type: 'integer', description: 'Slowmode delay in seconds (0 to disable)' }
                },
                required: ['seconds']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_user_info',
            description: 'Gets stats and info about a user in the server (join date, roles, etc).',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The user ID to fetch info for.' }
                },
                required: ['userId']
            }
        }
    },
    // Web & External APIs
    {
        type: 'function',
        function: {
            name: 'search_reddit',
            description: 'Fetches the top hot posts from a requested subreddit.',
            parameters: {
                type: 'object',
                properties: {
                    subreddit: { type: 'string', description: 'The name of the subreddit without r/ (e.g. perfectlycutscreams)' }
                },
                required: ['subreddit']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_random_joke',
            description: 'Fetches a random joke to tell the user.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_cat_fact',
            description: 'Fetches a random interesting cat fact.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_dog_image',
            description: 'Fetches a random cute dog image URL.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_urban_dictionary',
            description: 'Searches Urban Dictionary for a slang term definition.',
            parameters: {
                type: 'object',
                properties: {
                    term: { type: 'string', description: 'The slang word to search' }
                },
                required: ['term']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_crypto_price',
            description: 'Fetches the current price of a cryptocurrency.',
            parameters: {
                type: 'object',
                properties: {
                    coin: { type: 'string', description: 'The coin id (e.g. bitcoin, ethereum, dogecoin)' }
                },
                required: ['coin']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_image',
            description: 'Generates a custom AI image based on a text prompt.',
            parameters: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'The detailed description of the image to generate' }
                },
                required: ['prompt']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_trivia_question',
            description: 'Fetches a random trivia question to quiz the users.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_random_quote',
            description: 'Fetches a random inspirational or interesting quote.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_github_user',
            description: 'Fetches basic public repository count and followers for a GitHub user.',
            parameters: {
                type: 'object',
                properties: {
                    username: { type: 'string', description: 'The GitHub username' }
                },
                required: ['username']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_name_stats',
            description: 'Guesses a person\'s age based on their first name.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'The first name to analyze' }
                },
                required: ['name']
            }
        }
    },
    // ---- SERVER MANAGEMENT ----
    {
        type: 'function',
        function: {
            name: 'delete_channel',
            description: 'Deletes a channel from the server by channel ID or the current channel if none specified.',
            parameters: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'The channel ID to delete. Leave empty to delete the current channel.' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'rename_channel',
            description: 'Renames the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'The new channel name' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'set_channel_topic',
            description: 'Sets the topic/description of the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The new channel topic' }
                },
                required: ['topic']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_role',
            description: 'Creates a new role in the server with a given name and optional color.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Name of the role' },
                    color: { type: 'string', description: 'Hex color (e.g. #FF5733). Optional.' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'assign_role',
            description: 'Assigns an existing role to a server member by user ID and role name.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID' },
                    roleName: { type: 'string', description: 'The exact name of the role to assign' }
                },
                required: ['userId', 'roleName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'remove_role',
            description: 'Removes a role from a server member.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID' },
                    roleName: { type: 'string', description: 'The exact name of the role to remove' }
                },
                required: ['userId', 'roleName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'unban_user',
            description: 'Unbans a previously banned user from the server.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID to unban.' }
                },
                required: ['userId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_server_info',
            description: 'Fetches info about the current server (member count, owner, boost level, etc).',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_roles',
            description: 'Lists all roles in the server.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_channels',
            description: 'Lists all text channels in the server.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'dm_user',
            description: 'Sends a private Direct Message (DM) to a specific user.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID' },
                    content: { type: 'string', description: 'The message content to DM them' }
                },
                required: ['userId', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'send_to_channel',
            description: 'Sends a message to a specific channel by ID (not the current one).',
            parameters: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'The target channel ID' },
                    content: { type: 'string', description: 'The message to send' }
                },
                required: ['channelId', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'pin_message',
            description: 'Pins the most recent message in the current channel.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'announce',
            description: 'Sends a bolded @here announcement to the current channel.',
            parameters: {
                type: 'object',
                properties: {
                    message: { type: 'string', description: 'The announcement message to send' }
                },
                required: ['message']
            }
        }
    },
    // ---- POLLS & FUN ----
    {
        type: 'function',
        function: {
            name: 'create_poll',
            description: 'Creates a simple yes/no poll or multiple-choice reaction poll in the channel.',
            parameters: {
                type: 'object',
                properties: {
                    question: { type: 'string', description: 'The poll question' },
                    options: { type: 'string', description: 'Comma-separated options (up to 5). Leave empty for yes/no poll.' }
                },
                required: ['question']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'roll_dice',
            description: 'Rolls one or more dice (e.g. 2d6, 1d20). Returns the result.',
            parameters: {
                type: 'object',
                properties: {
                    dice: { type: 'string', description: 'Dice notation like 1d6, 2d20, 3d8. Default is 1d6.' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'pick_random',
            description: 'Picks a random item from a list of provided choices.',
            parameters: {
                type: 'object',
                properties: {
                    choices: { type: 'string', description: 'Comma-separated list of choices.' }
                },
                required: ['choices']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'coinflip',
            description: 'Flips a virtual coin and returns Heads or Tails.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_meme',
            description: 'Fetches a random hot meme from Reddit to post in the chat.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Gets current weather info for a city using the open-meteo API (no key needed).',
            parameters: {
                type: 'object',
                properties: {
                    city: { type: 'string', description: 'The city name to get weather for (e.g. London, Tokyo)' }
                },
                required: ['city']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'translate_text',
            description: 'Translates a piece of text to any language using the MyMemory free API.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text to translate' },
                    target_lang: { type: 'string', description: 'Target language code like EN, ES, FR, DE, JA, KO, AR' }
                },
                required: ['text', 'target_lang']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_minecraft_server',
            description: 'Fetches info about a Minecraft Java server (online status, player count).',
            parameters: {
                type: 'object',
                properties: {
                    host: { type: 'string', description: 'The Minecraft server address (e.g. hypixel.net)' }
                },
                required: ['host']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'read_channel_history',
            description: 'Reads the last N messages from the current channel and returns their content.',
            parameters: {
                type: 'object',
                properties: {
                    count: { type: 'integer', description: 'How many recent messages to read (max 20)' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_user_avatar',
            description: 'Fetches and posts the avatar/profile picture of a user.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'The Discord user ID' }
                },
                required: ['userId']
            }
        }
    },
    // ---- MEMORY TOOLS ----
    {
        type: 'function',
        function: {
            name: 'set_memory',
            description: 'Stores a piece of information in the long-term memory. Use this to remember user details, facts, or instructions.',
            parameters: {
                type: 'object',
                properties: {
                    slot: { type: 'integer', description: 'The memory slot index (0 to 99). Use different slots for different facts.' },
                    message: { type: 'string', description: 'The information to remember.' }
                },
                required: ['slot', 'message']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_memory',
            description: 'Retrieves a piece of information from a specific memory slot.',
            parameters: {
                type: 'object',
                properties: {
                    slot: { type: 'integer', description: 'The memory slot index to retrieve (0 to 99).' }
                },
                required: ['slot']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_memory',
            description: 'Lists all currently stored memories and their slot numbers.',
            parameters: { type: 'object', properties: {} }
        }
    }
];

async function executeTool(tName, args, message) {
    try {
        const adminOnlyTools = [
            'delete_recent_messages', 'timeout_user', 'kick_user', 'ban_user',
            'lock_channel', 'unlock_channel', 'create_channel', 'change_bot_nickname',
            'set_slowmode', 'delete_channel', 'rename_channel', 'set_channel_topic',
            'create_role', 'assign_role', 'remove_role', 'unban_user', 'get_server_info',
            'list_roles', 'list_channels', 'send_to_channel', 'pin_message', 'announce',
            'read_channel_history', 'dm_user', 'set_memory', 'get_memory', 'list_memory',
            'send_embed', 'get_user_info', 'react_to_recent_messages'
        ];

        if (adminOnlyTools.includes(tName)) {
            if (!message.guild) return `Error: This tool can only be used in a server.`;
            
            const config = db.getGuildConfig(message.guild.id);
            const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                (config.adminRoleId && message.member.roles.cache.has(config.adminRoleId));
            
            if (!isAdmin) {
                return `Error: Action denied. The user does not have administrator permissions. You are not allowed to give sensitive information or channel names or make announcements to non-admins.`;
            }
        }

        switch (tName) {
            case 'react_to_recent_messages': {
                const count = Math.min(args.count || 3, 20);
                const emoji = args.emoji;
                const msgs = await message.channel.messages.fetch({ limit: count + 1 });
                let reacted = 0;
                for (const msg of msgs.values()) {
                    if (msg.id !== message.id && reacted < count) {
                        await msg.react(emoji).catch(() => {});
                        reacted++;
                    }
                }
                return `Done! I've reacted to the last ${reacted} messages with ${emoji}.`;
            }
            case 'delete_recent_messages': {
                const count = Math.min(args.count || 5, 100);
                await message.channel.bulkDelete(count, true);
                return `Done! I've deleted the last ${count} messages. ✨`;
            }
            case 'timeout_user': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user.`;
                const ms = (args.minutes || 10) * 60 * 1000;
                await member.timeout(ms, args.reason || 'AI Requested');
                return `Successfully timed out <@${args.userId}> for ${args.minutes} minutes. 🧊`;
            }
            case 'kick_user': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user.`;
                await member.kick(args.reason || 'AI Requested');
                return `Successfully kicked <@${args.userId}>. 👢`;
            }
            case 'ban_user': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user.`;
                await member.ban({ reason: args.reason || 'AI Requested' });
                return `Successfully banned <@${args.userId}>. 🔨`;
            }
            case 'send_embed': {
                const embed = new EmbedBuilder()
                    .setTitle(args.title)
                    .setDescription(args.description)
                    .setColor(args.color || '#FFB6C1')
                    .setTimestamp();
                await message.channel.send({ embeds: [embed] });
                return `Embed successfully synthesized! 💖`;
            }
            case 'lock_channel': {
                await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
                return `Channel has been locked down. 🔒`;
            }
            case 'unlock_channel': {
                await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
                return `Channel has been unlocked. 🔓`;
            }
            case 'create_channel': {
                const channel = await message.guild.channels.create({ name: args.name });
                return `I created a new channel: <#${channel.id}>! ✨`;
            }
            case 'change_bot_nickname': {
                await message.guild.members.me.setNickname(args.nickname);
                return `My nickname is now **${args.nickname}**! 🌸`;
            }
            case 'set_slowmode': {
                await message.channel.setRateLimitPerUser(args.seconds || 0);
                return args.seconds === 0 ? `Slowmode disabled! 🐇` : `Slowmode set to ${args.seconds} seconds! 🐢`;
            }
            case 'get_user_info': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user.`;
                const embed = new EmbedBuilder()
                    .setTitle(`User Info: ${member.user.tag}`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                        { name: 'Roles', value: `${member.roles.cache.size - 1}`, inline: true }
                    )
                    .setColor('#FFB6C1');
                await message.channel.send({ embeds: [embed] });
                return `Here is the information you requested!`;
            }
            // WEB TOOLS
            case 'search_reddit': {
                const res = await fetch(`https://www.reddit.com/r/${args.subreddit}/hot.json?limit=3`).then(r => r.json()).catch(() => null);
                if (!res || !res.data || !res.data.children) return `I couldn't fetch from r/${args.subreddit}. It might not exist or be private. 🧊`;
                const posts = res.data.children.map(p => `**${p.data.title}**\n<https://reddit.com${p.data.permalink}>`).join('\n\n');
                return `Here are the top posts from r/${args.subreddit}:\n\n${posts}`;
            }

            case 'get_random_joke': {
                const res = await fetch(`https://official-joke-api.appspot.com/random_joke`).then(r => r.json()).catch(() => null);
                if (!res) return `I forgot the joke I was going to tell... 🧊`;
                return `${res.setup}\n\n||${res.punchline}|| 😂`;
            }
            case 'get_cat_fact': {
                const res = await fetch(`https://catfact.ninja/fact`).then(r => r.json()).catch(() => null);
                if (!res) return `Cats are mysterious... 🐈`;
                return `Did you know? ${res.fact} 🐾`;
            }
            case 'get_dog_image': {
                const res = await fetch(`https://dog.ceo/api/breeds/image/random`).then(r => r.json()).catch(() => null);
                if (!res || !res.message) return `Who let the dogs out? 🐕`;
                return `Here's a cute dog for you! 🐶\n${res.message}`;
            }
            case 'get_urban_dictionary': {
                const query = encodeURIComponent(args.term);
                const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${query}`).then(r => r.json()).catch(() => null);
                if (!res || !res.list || res.list.length === 0) return `I couldn't find that slang in the dictionary. 🧊`;
                const def = res.list[0].definition.replace(/\[|\]/g, ''); // UD wraps links in brackets
                return `**${args.term}**: ${def}`;
            }
            case 'get_crypto_price': {
                const coin = args.coin.toLowerCase();
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`).then(r => r.json()).catch(() => null);
                if (!res || !res[coin]) return `I couldn't find the price for ${args.coin}. Make sure you use the full name (like 'bitcoin' not 'btc'). 🧊`;
                return `The current price of **${args.coin}** is **$${res[coin].usd}**. 💸`;
            }
            case 'generate_image': {
                await message.channel.sendTyping();
                // Image generation on Pollinations is free - do NOT send API key to avoid 401/402 errors
                const imagePrompt = encodeURIComponent(args.prompt || 'abstract art');
                const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;
                const res = await fetch(imageUrl).catch(() => null);
                if (!res || !res.ok) return `I couldn't imagine that properly right now! 🧊`;
                const buffer = await res.arrayBuffer();
                const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'imagine.jpeg' });
                await message.channel.send({ content: `🎨 **Imagined:** *${args.prompt}*`, files: [attachment] });
                return `Successfully generated the image!`;
            }
            case 'get_trivia_question': {
                const res = await fetch(`https://opentdb.com/api.php?amount=1&type=multiple`).then(r => r.json()).catch(() => null);
                if (!res || !res.results || !res.results[0]) return `I couldn't think of a trivia question. 🧊`;
                const t = res.results[0];
                return `**Trivia Category: ${t.category}**\n*Difficulty: ${t.difficulty}*\n\n**Q:** ${t.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}\n\n||**A:** ${t.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}||`;
            }
            case 'get_random_quote': {
                const res = await fetch(`https://api.quotable.io/random`).then(r => r.json()).catch(() => null);
                if (!res || !res.content) return `I couldn't find a quote. 🧊`;
                return `"${res.content}" \n- **${res.author}**`;
            }
            case 'search_github_user': {
                const res = await fetch(`https://api.github.com/users/${encodeURIComponent(args.username)}`).then(r => r.json()).catch(() => null);
                if (!res || res.message === 'Not Found') return `I couldn't find a GitHub user named ${args.username}. 🧊`;
                const embed = new EmbedBuilder()
                    .setTitle(`GitHub: ${res.login}`)
                    .setURL(res.html_url)
                    .setThumbnail(res.avatar_url)
                    .setDescription(res.bio || 'No bio provided.')
                    .addFields(
                        { name: 'Public Repos', value: `${res.public_repos}`, inline: true },
                        { name: 'Followers', value: `${res.followers}`, inline: true }
                    )
                    .setColor('#2b3137');
                await message.channel.send({ embeds: [embed] });
                return `Here is the GitHub info for ${args.username}!`;
            }
            case 'get_name_stats': {
                const name = encodeURIComponent(args.name);
                const ageRes = await fetch(`https://api.agify.io?name=${name}`).then(r => r.json()).catch(() => null);
                if (!ageRes || !ageRes.age) return `I couldn't find any stats for the name ${args.name}. 🧊`;
                return `Based on my dataset, people named **${args.name}** are typically around **${ageRes.age}** years old! 🤯`;
            }
            // ---- SERVER MANAGEMENT ----
            case 'delete_channel': {
                const ch = args.channelId ? message.guild.channels.cache.get(args.channelId) : message.channel;
                if (!ch) return `I couldn't find that channel. 🧊`;
                await ch.delete();
                return `Channel deleted successfully. 🗑️`;
            }
            case 'rename_channel': {
                await message.channel.setName(args.name);
                return `Channel renamed to **${args.name}**! ✏️`;
            }
            case 'set_channel_topic': {
                await message.channel.setTopic(args.topic);
                return `Channel topic set to: *${args.topic}* 📌`;
            }
            case 'create_role': {
                const role = await message.guild.roles.create({ name: args.name, color: args.color || null });
                return `Created new role **${role.name}**! 🎭`;
            }
            case 'assign_role': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user. 🧊`;
                const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args.roleName.toLowerCase());
                if (!role) return `I couldn't find a role named **${args.roleName}**. 🧊`;
                await member.roles.add(role);
                return `Assigned **${role.name}** to <@${args.userId}>! ✅`;
            }
            case 'remove_role': {
                const member = await message.guild.members.fetch(args.userId).catch(() => null);
                if (!member) return `I couldn't find that user. 🧊`;
                const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args.roleName.toLowerCase());
                if (!role) return `I couldn't find a role named **${args.roleName}**. 🧊`;
                await member.roles.remove(role);
                return `Removed **${role.name}** from <@${args.userId}>! ✅`;
            }
            case 'unban_user': {
                await message.guild.bans.remove(args.userId).catch(() => null);
                return `<@${args.userId}> has been unbanned. 🕊️`;
            }
            case 'get_server_info': {
                const g = message.guild;
                await g.fetchOwner();
                const embed = new EmbedBuilder()
                    .setTitle(`📊 ${g.name}`)
                    .setThumbnail(g.iconURL({ dynamic: true }))
                    .addFields(
                        { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
                        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
                        { name: '✨ Boost Level', value: `${g.premiumTier}`, inline: true },
                        { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
                        { name: '🔧 Channels', value: `${g.channels.cache.size}`, inline: true },
                        { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true }
                    )
                    .setColor('#5865F2');
                await message.channel.send({ embeds: [embed] });
                return `Here is the server info!`;
            }
            case 'list_roles': {
                const roles = message.guild.roles.cache
                    .filter(r => r.id !== message.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(r => `• **${r.name}** (${r.members.size} members)`)
                    .slice(0, 20);
                const embed = new EmbedBuilder().setTitle('🎭 Server Roles').setDescription(roles.join('\n')).setColor('#FFB6C1');
                await message.channel.send({ embeds: [embed] });
                return `Listed ${roles.length} roles!`;
            }
            case 'list_channels': {
                const channels = message.guild.channels.cache
                    .filter(c => c.isTextBased())
                    .map(c => `• <#${c.id}> — ${c.name}`)
                    .slice(0, 20);
                const embed = new EmbedBuilder().setTitle('📋 Text Channels').setDescription(channels.join('\n')).setColor('#5865F2');
                await message.channel.send({ embeds: [embed] });
                return `Listed ${channels.length} text channels!`;
            }
            case 'dm_user': {
                const user = await message.client.users.fetch(args.userId).catch(() => null);
                if (!user) return `I couldn't find that user. 🧊`;
                await user.send(args.content).catch(() => null);
                return `📬 DM sent to <@${args.userId}>!`;
            }
            case 'send_to_channel': {
                const ch = message.guild.channels.cache.get(args.channelId);
                if (!ch) return `I couldn't find that channel. 🧊`;
                await ch.send(args.content);
                return `✅ Message sent to <#${args.channelId}>!`;
            }
            case 'pin_message': {
                const msgs = await message.channel.messages.fetch({ limit: 2 });
                const target = msgs.find(m => m.id !== message.id);
                if (!target) return `No message to pin. 🧊`;
                await target.pin();
                return `📌 Message pinned!`;
            }
            case 'announce': {
                await message.channel.send(`@here\n\n📣 **ANNOUNCEMENT**\n\n${args.message}`);
                return `Announcement sent! 📣`;
            }
            // ---- POLLS & FUN ----
            case 'create_poll': {
                const opts = args.options ? args.options.split(',').map(o => o.trim()).filter(Boolean).slice(0, 5) : null;
                const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
                const embed = new EmbedBuilder()
                    .setTitle(`📊 Poll: ${args.question}`)
                    .setColor('#FFB6C1')
                    .setFooter({ text: 'React below to vote!' });
                if (opts && opts.length > 1) {
                    embed.setDescription(opts.map((o, i) => `${numberEmojis[i]} ${o}`).join('\n'));
                } else {
                    embed.setDescription('React with ✅ for Yes or ❌ for No!');
                }
                const pollMsg = await message.channel.send({ embeds: [embed] });
                if (opts && opts.length > 1) {
                    for (let i = 0; i < opts.length; i++) await pollMsg.react(numberEmojis[i]);
                } else {
                    await pollMsg.react('✅');
                    await pollMsg.react('❌');
                }
                return `Poll created! 🗳️`;
            }
            case 'roll_dice': {
                const notation = (args.dice || '1d6').toLowerCase();
                const match = notation.match(/^(\d+)d(\d+)$/);
                if (!match) return `Invalid dice notation. Use formats like 1d6, 2d20, 3d8. 🧊`;
                const count = Math.min(parseInt(match[1]), 20);
                const sides = parseInt(match[2]);
                const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
                const total = rolls.reduce((a, b) => a + b, 0);
                return `🎲 Rolled **${notation}**: [${rolls.join(', ')}] = **${total}**`;
            }
            case 'pick_random': {
                const choices = args.choices.split(',').map(c => c.trim()).filter(Boolean);
                if (choices.length === 0) return `No choices given! 🧊`;
                const pick = choices[Math.floor(Math.random() * choices.length)];
                return `🎯 I pick: **${pick}**`;
            }
            case 'coinflip': {
                const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
                return `I flipped a coin... it's **${result}**!`;
            }
            case 'get_meme': {
                const res = await fetch('https://www.reddit.com/r/memes/hot.json?limit=25').then(r => r.json()).catch(() => null);
                if (!res?.data?.children) return `Couldn't load memes right now. 🧊`;
                const posts = res.data.children.filter(p => p.data.url.match(/\.(jpg|png|gif)$/i));
                if (!posts.length) return `No image memes found. 🧊`;
                const post = posts[Math.floor(Math.random() * posts.length)].data;
                const embed = new EmbedBuilder().setTitle(post.title).setImage(post.url).setURL(`https://reddit.com${post.permalink}`).setColor('#FF4500');
                await message.channel.send({ embeds: [embed] });
                return `Meme deployed! 😂`;
            }
            case 'get_weather': {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1`).then(r => r.json()).catch(() => null);
                if (!geoRes?.results?.[0]) return `I couldn't find the city "${args.city}". 🧊`;
                const { latitude, longitude, name, country } = geoRes.results[0];
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m`).then(r => r.json()).catch(() => null);
                if (!weatherRes?.current) return `Couldn't fetch weather data. 🧊`;
                const c = weatherRes.current;
                const codes = { 0:'☀️ Clear', 1:'🌤️ Mainly Clear', 2:'⛅ Partly Cloudy', 3:'☁️ Overcast', 45:'🌫️ Foggy', 48:'🌫️ Icy Fog', 51:'🌦️ Light Drizzle', 61:'🌧️ Light Rain', 63:'🌧️ Moderate Rain', 65:'🌧️ Heavy Rain', 71:'🌨️ Snow', 80:'🌦️ Showers', 95:'⛈️ Thunderstorm' };
                const condition = codes[c.weathercode] || `Code ${c.weathercode}`;
                const embed = new EmbedBuilder()
                    .setTitle(`🌍 Weather in ${name}, ${country}`)
                    .addFields(
                        { name: 'Condition', value: condition, inline: true },
                        { name: '🌡️ Temperature', value: `${c.temperature_2m}°C`, inline: true },
                        { name: '💧 Humidity', value: `${c.relativehumidity_2m}%`, inline: true },
                        { name: '💨 Wind Speed', value: `${c.windspeed_10m} km/h`, inline: true }
                    )
                    .setColor('#87CEEB');
                await message.channel.send({ embeds: [embed] });
                return `Weather data retrieved!`;
            }
            case 'translate_text': {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(args.text)}&langpair=en|${args.target_lang}`).then(r => r.json()).catch(() => null);
                if (!res?.responseData?.translatedText) return `Translation failed. 🧊`;
                return `🌐 **Translation (→${args.target_lang}):**\n${res.responseData.translatedText}`;
            }
            case 'get_minecraft_server': {
                const res = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(args.host)}`).then(r => r.json()).catch(() => null);
                if (!res) return `Couldn't query that server. 🧊`;
                if (!res.online) return `🔴 **${args.host}** is **offline** or not a valid server.`;
                const embed = new EmbedBuilder()
                    .setTitle(`⛏️ ${args.host}`)
                    .addFields(
                        { name: '🟢 Status', value: 'Online', inline: true },
                        { name: '👥 Players', value: `${res.players?.online ?? 0}/${res.players?.max ?? 0}`, inline: true },
                        { name: '🏷️ Version', value: res.version || 'Unknown', inline: true },
                        { name: '📝 MOTD', value: res.motd?.clean?.[0] || 'None', inline: false }
                    )
                    .setColor('#5c8a00');
                await message.channel.send({ embeds: [embed] });
                return `Server info retrieved!`;
            }
            case 'read_channel_history': {
                const count = Math.min(args.count || 10, 20);
                const msgs = await message.channel.messages.fetch({ limit: count + 1 });
                const history = [...msgs.values()]
                    .filter(m => m.id !== message.id)
                    .slice(0, count)
                    .reverse()
                    .map(m => `[${m.author.username}]: ${m.content || '(embed/attachment)'}`)
                    .join('\n');
                return `Here are the last ${count} messages:\n\`\`\`\n${history}\n\`\`\``;
            }
            case 'get_user_avatar': {
                const user = await message.client.users.fetch(args.userId).catch(() => null);
                if (!user) return `I couldn't find that user. 🧊`;
                const avatarUrl = user.displayAvatarURL({ size: 512, extension: 'png' });
                const embed = new EmbedBuilder()
                    .setTitle(`🖼️ ${user.username}'s Avatar`)
                    .setImage(avatarUrl)
                    .setColor('#FFB6C1');
                await message.channel.send({ embeds: [embed] });
                return `Avatar displayed!`;
            }
            // ---- MEMORY TOOLS ----
            case 'set_memory': {
                const db = require('./database');
                db.setMemory(args.slot, args.message);
                return `Done! I've saved that information to memory slot #${args.slot}. 🧠`;
            }
            case 'get_memory': {
                const db = require('./database');
                const mem = db.getMemory(args.slot);
                if (!mem) return `Memory slot #${args.slot} is currently empty. 🧊`;
                return `Here's what I remember in slot #${args.slot}:\n\n${mem}`;
            }
            case 'list_memory': {
                const db = require('./database');
                const all = db.getAllMemory();
                const keys = Object.keys(all);
                if (keys.length === 0) return `My long-term memory is currently empty. 🌱`;
                const list = keys.map(slot => `• **Slot ${slot}**: ${all[slot].substring(0, 50)}${all[slot].length > 50 ? '...' : ''}`).join('\n');
                return `Here are my stored memories:\n\n${list}`;
            }
            default:
                return `I tried to use a tool but didn't recognize it.`;
        }
    } catch (err) {
        console.error(`[Tool execution failed: ${tName}]`, err);
        return `I tried to run an action but hit an error! Make sure I have Administrator permissions. 🧊`;
    }
}

module.exports = {
    aiToolDefinitions,
    executeTool
};
