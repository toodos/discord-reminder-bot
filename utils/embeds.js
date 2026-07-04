/**
 * utils/embeds.js
 * 🤖 Centralized embed factories — professional, clean, and cute robot themed.
 */
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  success: 0x00F5D4, // Neon Mint/Teal
  danger: 0xFF0055,  // Neon Cyber Red/Pink
  warning: 0xFFBE0B, // Neon Amber Gold
  info: 0x3A86FF,    // Premium Silicon Blue
  pink: 0xFF007F,    // Electric Hot Pink
  gold: 0xFFB703,    // Cyber Gold
  mint: 0x06D6A0,    // Mint Green
  sky: 0x00B4D8,     // Sky Cyan
  peach: 0xFF9F1C,   // Neon Peach
  lilac: 0x8338EC,   // Cyber Violet / AI Purple
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
  return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** A clean premium divider line */
function divider() {
  return "✦ ──── ✦ ──── ✦ ──── ✦";
}

/** Pick a random cute robotic footer message */
const FOOTER_QUIPS = [
  "🤖 Automation Unit • Processing with a smile!",
  "✨ Systems optimized for your convenience.",
  "📋 Organizing data efficiently. Beep!",
  "🔋 Energy levels nominal. Ready to assist!",
  "🔧 All gears and sprockets functioning properly.",
  "💡 Idea generated! I am here to help.",
  "☕ Enjoying a brief oil break. Just kidding!",
  "📈 Diagnostics report: 100% friendly.",
  "🌟 Calculating the most optimal outcome...",
  "📦 Delivering your data packets safely.",
  "⚙️ Whirring softly in the background.",
  "📊 Data compiled with precise care.",
  "🔋 Recharging social batteries...",
  "💬 Analyzing your request... Done!",
  "🤖 Beep boop! Have a productive day.",
];

function footerQuip() {
  return FOOTER_QUIPS[Math.floor(Math.random() * FOOTER_QUIPS.length)];
}

/**
 * Base embed with shared defaults — friendly sky blue, timestamp, cute footer.
 */
function base(color = COLORS.sky) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: footerQuip() });
}

// ── Error Embed ───────────────────────────────────────────────────────────────

/** Standard error embed */
function errorEmbed(content) {
  return new EmbedBuilder()
    .setColor(COLORS.danger)
    .setTitle("⚠️  System Alert")
    .setDescription(
      `> 🤖 *I encountered an unexpected variable...*\n\n` +
        `> ${content}\n\n` +
        `*${divider()}*\n` +
        `*Please verify your input parameters and try again.*`,
    )
    .setFooter({
      text: "🔧 Diagnostic routines deployed.",
    })
    .setTimestamp();
}

// ── Tier Helper ───────────────────────────────────────────────────────────────

function getTier(balance) {
  if (balance >= 100000) return { icon: "💎", name: "Premium Automaton" };
  if (balance >= 50000) return { icon: "🌟", name: "Gold Standard Unit" };
  if (balance >= 10000) return { icon: "📈", name: "Efficient Processor" };
  if (balance >= 1000) return { icon: "⚙️", name: "Reliable Machine" };
  return { icon: "🤖", name: "Standard Assistant" };
}

// ── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
  return {
    file: asset("reminder.png"),
    embed: base(COLORS.lilac)
      .setTitle("⏰  Reminder Configured")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*📡 Transmission established. Saved coordinates to memory.*\n\n` +
          `I will gently remind **${targetUser.username}** in exactly **\`${timeStr}\`**!\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "📝  Memo Details", value: `\`\`\`${message}\`\`\`` },
        {
          name: "⏱️  Execution Time",
          value: `\`${timeStr}\``,
          inline: true,
        },
        {
          name: "📍  Delivery Location",
          value: `${targetChannel}`,
          inline: true,
        },
      ),
  };
}

function reminderFiredEmbed(message, initiatorTag) {
  return {
    file: asset("reminder.png"),
    embed: new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle("🛎️  Incoming Reminder")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*⚡ Automated ping to target user.*\n\n` +
          `> **${message}**\n\n` +
          `*${divider()}*`,
      )
      .setFooter({
        text: `✨ Scheduled by ${initiatorTag} • Awaiting further tasks.`,
      })
      .setTimestamp(),
  };
}

// ── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
  const unix = Math.floor(endTime / 1000);
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.info)
      .setTitle("🔌  Recharge Cycle Initiated")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*🔋 Unit offline. Initiating forced recharge.*\n\n` +
          `**${targetUser.username}** has been sent to the charging station. All functions are suspended until completion.\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "⏳  Duration", value: `\`${timeStr}\``, inline: true },
        { name: "⏱️  End Cycle", value: `<t:${unix}:T>`, inline: true },
        { name: "⌛  Time Left", value: `<t:${unix}:R>`, inline: true },
        { name: "🛡️  Authorized By", value: `${initiator}`, inline: true },
      ),
  };
}

function cooldownExpiredEmbed(mention) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.success)
      .setTitle("✨  Recharge Cycle Complete")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*⚡ Power levels at 100%. Main core initialized.*\n\n` +
          `Welcome back, ${mention}! All diagnostics indicate optimal unit performance.\n\n` +
          `*${divider()}*`,
      ),
  };
}

function cooldownRemovedEmbed(targetUser) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.mint)
      .setTitle("🔓  Override: Recharge Aborted")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*⚠️ Emergency wake sequence executed by Administrator.*\n\n` +
          `Auxiliary backup power has been routed to **${targetUser}**. Sleep cycle terminated.\n\n` +
          `*${divider()}*`,
      ),
  };
}

// ── Economy Embeds ───────────────────────────────────────────────────────────

function balanceEmbed(
  client,
  targetUser,
  balance,
  rank,
  leaderboardStr,
  totalEconomy,
) {
  const tier = getTier(balance);
  return {
    file: asset("balance.png"),
    embed: new EmbedBuilder()
      .setColor(COLORS.info)
      .setAuthor({
        name: `💳 ${targetUser.username}'s Account Ledger`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("attachment://balance.png")
      .setDescription(
        `*🔑 Accessing ledger databases... Status: Authorized.*\n\n` +
          `### 🏆  Top Contributor Board\n` +
          (leaderboardStr || "*No active user records found.*") +
          `\n\n*${divider()}*`,
      )
      .addFields(
        {
          name: `${tier.icon}  Rupee Balance`,
          value: `\`\`\`₹${balance.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: "📈  Rank",
          value: `\`\`\`#${rank}\`\`\``,
          inline: true,
        },
        {
          name: "🏅  Unit Status",
          value: `\`${tier.icon} ${tier.name}\``,
          inline: true,
        },
      )
      .setFooter({
        text: `💰 ₹${totalEconomy.toLocaleString()} managed by this unit  •  ${footerQuip()}`,
      })
      .setTimestamp(),
  };
}

function addMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
  const tier = getTier(newBalance);
  const oldTier = getTier(oldBalance);
  const promoted = oldTier.name !== tier.name;
  const tierLine = promoted
    ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} **${tier.name}** 🎉`
    : `${tier.icon} ${tier.name}`;

  return {
    file: asset("money.png"),
    embed: base(COLORS.success)
      .setTitle("💵  Funds Successfully Deposited")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*📥 Ledger updated. Transaction verified.*\n\n` +
          `Deposited **₹${amount.toLocaleString()}** to the account of ${targetUser}.\n\n` +
          (promoted
            ? `🌟 *System notification: Unit Status upgraded!* \n\n`
            : "") +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Total Holdings",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Unit Status", value: tierLine, inline: true },
      ),
  };
}

// ── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
  const slotEmojis = ["📦", "📋", "🔋", "⚙️"];
  const lines = [1, 2, 3, 4]
    .map((slot, i) => {
      const msg = slots[slot];
      const preview = msg
        ? msg.length > 55
          ? msg.slice(0, 52) + "..."
          : msg
        : "*[ empty storage block ]*";
      const charCnt = msg ? `\`${msg.length} bits\`` : "`0 bits`";
      return `${slotEmojis[i]}  **Block ${slot}:** ${preview} — ${charCnt}`;
    })
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.sky)
    .setTitle("🗄️  Internal Storage Archive")
    .setDescription(
      `*💾 Reading local database sectors... Status: Nominal.*\n\n` +
        `Here is the data currently cached in my drives:\n\n` +
        `${lines}\n\n` +
        `*${divider()}*`,
    )
    .setFooter({ text: footerQuip() })
    .setTimestamp();
}

function removeMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
  const tier = getTier(newBalance);
  const oldTier = getTier(oldBalance);
  const demoted = oldTier.name !== tier.name;
  const tierLine = demoted
    ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} ${tier.name}`
    : `${tier.icon} ${tier.name}`;

  return {
    file: asset("money.png"),
    embed: base(COLORS.peach)
      .setTitle("💸  Funds Successfully Debited")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*📤 Ledger updated. Transaction verified.*\n\n` +
          `Debited **₹${amount.toLocaleString()}** from the account of ${targetUser}.\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Remaining Balance",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Unit Status", value: tierLine, inline: true },
      ),
  };
}

// ── Ticket Embeds ─────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`✉️  Support Ticket Logged  •  #${count}`)
    .setDescription(
      `*📡 Communication channel established.*\n\n` +
        `Hello ${user}! Your request has been securely filed.\n` +
        `Our support crew has been paged and will join the terminal shortly.\n` +
        `Please detail your request while you wait. ☕\n\n` +
        `*${divider()}*`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "📁  Department",
        value: `${category.emoji} ${category.name}`,
        inline: true,
      },
      { name: "👤  Requested By", value: `${user}`, inline: true },
    )
    .setFooter({
      text: "🤖 Oakawol Automated Support Unit",
    })
    .setTimestamp();

  const keys = Object.keys(answers);
  if (keys.length > 0) {
    embed.addFields({
      name: "\u200B",
      value: `*${divider()}*\n📋  **Intake Form Data** *(Pre-filled Details)*`,
    });
    embed.addFields(
      keys.map((k) => ({
        name: `✦ ${k}`,
        value: `> ${answers[k]}`,
        inline: false,
      })),
    );
  }
  return embed;
}

function categoryListEmbed(categories) {
  const rows = categories
    .map((c) => `${c.emoji}  **${c.name}**  \`ID: ${c.id}\``)
    .join("\n");

  return new EmbedBuilder()
    .setColor(COLORS.sky)
    .setTitle("💻  Support Terminal Directory")
    .setDescription(
      `*🌐 Querying active departments...*\n\n` +
        `Select the support department you wish to contact below:\n\n` +
        `${rows || "*No active departments found.*"}\n\n` +
        `*${divider()}*`,
    )
    .setFooter({ text: footerQuip() })
    .setTimestamp();
}

module.exports = {
  COLORS,
  asset,
  divider,
  footerQuip,
  errorEmbed,
  reminderSetEmbed,
  reminderFiredEmbed,
  cooldownSetEmbed,
  cooldownExpiredEmbed,
  cooldownRemovedEmbed,
  balanceEmbed,
  addMoneyEmbed,
  removeMoneyEmbed,
  memoryListEmbed,
  ticketWelcomeEmbed,
  categoryListEmbed,
};
