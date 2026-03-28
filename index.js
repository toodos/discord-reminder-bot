/**
 * index.js
 * Entry point. Sets up the client, loads handlers, and starts the bot.
 */
require("dotenv").config();

// ─── Environment Validation ───────────────────────────────────────────────────

const REQUIRED_ENV = ["DISCORD_TOKEN", "CLIENT_ID"];
const OPTIONAL_ENV = ["GUILD_ID", "CEREBRAS_API_KEY", "GROQ_API_KEY"];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `[Config] ❌ Missing required environment variable(s): ${missingEnv.join(", ")}`,
  );
  console.error(
    "[Config] Please create a .env file with all required variables. See README for details.",
  );
  process.exit(1);
}

for (const key of OPTIONAL_ENV) {
  if (!process.env[key]) {
    if (key === "CEREBRAS_API_KEY") {
      console.warn(
        `[Config] ⚠️  Optional env var "CEREBRAS_API_KEY" is not set. Cerebras (primary engine) will be skipped.`,
      );
    } else if (key === "GROQ_API_KEY") {
      console.warn(
        `[Config] ⚠️  Optional env var "GROQ_API_KEY" is not set. Groq (fallback engine) will be skipped.`,
      );
    } else {
      console.warn(
        `[Config] ⚠️  Optional env var "${key}" is not set. Commands will be deployed globally (up to 1h delay).`,
      );
    }
  }
}

if (!process.env.CEREBRAS_API_KEY && !process.env.GROQ_API_KEY) {
  console.warn(
    "[Config] ⚠️  Neither CEREBRAS_API_KEY nor GROQ_API_KEY is set — AI chat will not work.",
  );
}

const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionFlagsBits,
} = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const {
  handleButton,
  handleModal,
  handleSelectMenu,
  handleContextMenu,
} = require("./handlers/interactionRouter");
const timerManager = require("./utils/timerManager");
const statuses = require("./utils/statuses");
const onMessageCreate = require("./events/messageCreate");
const { errorEmbed } = require("./utils/embeds");

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
client.commands = commands;

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once("ready", () => {
  console.log(`[Bot] Logged in as ${client.user.tag}`);

  let statusIndex = 0;
  let lastActivityTime = Date.now();
  let isBusy = false;

  // Expose activity tracker globally so messageCreate.js can call it
  client.setActivity = (busy) => {
    isBusy = busy;
    if (busy) lastActivityTime = Date.now();
  };

  const updatePresence = () => {
    const idleThresholdMs = 10 * 60 * 1000; // 10 minutes
    const timeSinceActivity = Date.now() - lastActivityTime;

    if (isBusy) {
      // DND = bot is currently processing something
      client.user.setPresence({
        activities: [{ name: "⚙️ Processing...", type: ActivityType.Custom }],
        status: "dnd",
      });
    } else if (timeSinceActivity > idleThresholdMs) {
      // Idle = no one has used the bot in 10+ minutes
      client.user.setPresence({
        activities: [
          { name: statuses[statusIndex], type: ActivityType.Custom },
        ],
        status: "idle",
      });
      statusIndex = (statusIndex + 1) % statuses.length;
    } else {
      // Online = active but not busy
      client.user.setPresence({
        activities: [
          { name: statuses[statusIndex], type: ActivityType.Custom },
        ],
        status: "online",
      });
      statusIndex = (statusIndex + 1) % statuses.length;
    }
  };

  updatePresence();
  setInterval(updatePresence, 20000); // Cycle every 20 seconds

  timerManager.init(client);
});

// ─── Interactions ─────────────────────────────────────────────────────────────

client.on("interactionCreate", async (interaction) => {
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
    } else if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      await command.autocomplete(interaction);
    }
  } catch (error) {
    console.error("[Interaction Error]", error);

    let msg = "Something went a little wobbly! Please try again. 🧊💦";
    if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      msg += `\n\n**Debug:** \`${error.message}\``;
    }

    const replyFn =
      interaction.replied || interaction.deferred ? "followUp" : "reply";
    await interaction[replyFn]({
      embeds: [errorEmbed(msg)],
      ephemeral: true,
    }).catch(() => {});
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

client.on("messageCreate", onMessageCreate);

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
