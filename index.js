/**
 * index.js
 * Entry point. Sets up the client, loads handlers, and starts the bot.
 */
require('dotenv').config();

const { Client, GatewayIntentBits, Partials, ActivityType, PermissionFlagsBits } = require('discord.js');
const { loadCommands }    = require('./handlers/commandHandler');
const { handleButton, handleModal, handleSelectMenu, handleContextMenu } = require('./handlers/interactionRouter');
const timerManager        = require('./utils/timerManager');
const onMessageCreate     = require('./events/messageCreate');
const { errorEmbed }      = require('./utils/embeds');

// ─── Client Setup ─────────────────────────────────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

const commands = loadCommands();

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once('ready', () => {
    console.log(`[Bot] Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: 'Baking strawberry cupcakes 🍓🧁', type: ActivityType.Custom }],
        status: 'dnd',
    });

    timerManager.init(client);
});

// ─── Interactions ─────────────────────────────────────────────────────────────

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);

        } else if (interaction.isMessageContextMenuCommand()) {
            await handleContextMenu(interaction);

        } else if (interaction.isButton()) {
            await handleButton(interaction);

        } else if (interaction.isModalSubmit()) {
            await handleModal(interaction);

        } else if (interaction.isUserSelectMenu()) {
            await handleSelectMenu(interaction);
        }

    } catch (error) {
        console.error('[Interaction Error]', error);

        let msg = 'Something went a little wobbly! Please try again. 🧊💦';
        if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            msg += `\n\n**Debug:** \`${error.message}\``;
        }

        const replyFn = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyFn]({ embeds: [errorEmbed(msg)], ephemeral: true }).catch(() => {});
    }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

client.on('messageCreate', onMessageCreate);

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
