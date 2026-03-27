const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

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
            name: 'search_wikipedia',
            description: 'Searches Wikipedia for a query and returns the summary.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'What to search for' }
                },
                required: ['query']
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
    }
];

async function executeTool(tName, args, message) {
    try {
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
            case 'search_wikipedia': {
                const query = encodeURIComponent(args.query);
                const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=1&format=json`).then(r => r.json()).catch(() => null);
                if (!res || !res[1] || !res[1][0]) return `I couldn't find anything on Wikipedia for "${args.query}". 🧊`;
                return `Here's what I found on Wikipedia for **${res[1][0]}**:\n${res[3][0]}`;
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
                const prompt = encodeURIComponent(args.prompt);
                let url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux`;
                if (process.env.POLLINATIONS_API_KEY && !process.env.POLLINATIONS_API_KEY.includes('your_')) {
                    url += `&key=${encodeURIComponent(process.env.POLLINATIONS_API_KEY.trim())}`;
                }
                const res = await fetch(url).catch(() => null);
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
