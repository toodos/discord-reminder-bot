/**
 * utils/embeds.js
 * 🤖 Centralized embed factories — professional, clean, and cute robot themed.
 */
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  success: 0x4caf50, // clean indicator green
  danger: 0xf44336, // alert amber/red
  warning: 0xffeb3b, // soft warning yellow
  info: 0x2196f3, // silicon blue
  pink: 0xff4081, // vibrant pink
  gold: 0xffc107, // crisp gold
  mint: 0x81c784, // soft mint
  sky: 0x03a9f4, // friendly sky blue
  peach: 0xffab40, // light orange
  lilac: 0xba68c8, // AI violet
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
  return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** A polite, dotted delimiter line */
function divider() {
  return "◦ ── ◦ ── ◦ ── ◦ ── ◦";
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
    .setTitle("⚠️ SYSTEM ALERT")
    .setDescription(
      `> 🤖 *I encountered an unexpected variable...*\n\n` +
        `> ${content}\n\n` +
        `*${divider()}*\n` +
        `*Please check your input parameters and try again!*`,
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
      .setTitle("⏰ ALARM LOGGED SUCCESSFULLY")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*< saving coordinates to internal memory >*\n\n` +
          `Hello! I have registered your request. 📋\n` +
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
      .setTitle("⏰ BEEP! SCHEDULED REMINDER")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*< pinging target user >*\n\n` +
          `Excuse me! 🤖 I have a scheduled delivery for you:\n\n` +
          `> ### 🛎️ ${message}\n\n` +
          `*${divider()}*\n` +
          `*Task completed. Awaiting further instructions.*`,
      )
      .setFooter({
        text: `✨ Scheduled by ${initiatorTag} • Delivered precisely on time.`,
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
      .setTitle("🔋 FORCED RECHARGE INITIATED")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< dimming optical sensors >*\n\n` +
          `🔌 **${targetUser.username}** has been assigned to the charging station.\n` +
          `All active functions are paused until the recharge cycle completes. 💤\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "🔋  Charge Time", value: `\`${timeStr}\``, inline: true },
        { name: "⏱️  End Cycle", value: `<t:${unix}:T>`, inline: true },
        { name: "⏳  Time Left", value: `<t:${unix}:R>`, inline: true },
        { name: "🛡️  Assigned By", value: `${initiator}`, inline: true },
      ),
  };
}

function cooldownExpiredEmbed(mention) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.success)
      .setTitle("✨ RECHARGE CYCLE COMPLETE")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< initializing main subroutines >*\n\n` +
          `Good news, ${mention}!\n` +
          `Your battery levels are back to 100%. All systems reflect optimal health.\n` +
          `You are cleared to resume normal activities. 🤖💻\n\n` +
          `*${divider()}*`,
      ),
  };
}

function cooldownRemovedEmbed(targetUser) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.mint)
      .setTitle("🔓 OVERRIDE: RECHARGE ABORTED")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< emergency wake sequence triggered >*\n\n` +
          `⚡ A system administrator has interrupted the sleep cycle for ${targetUser}.\n` +
          `Auxiliary power has been instantly restored. Welcome back! 🤖\n\n` +
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
        `*< accessing secure banking API >*\n\n` +
          `### 🌐  The Elite Contributor Board\n` +
          (leaderboardStr ||
             "*No active user records found... Beep!* 🤖") +
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
      .setTitle("💵 FUNDS SUCCESSFULLY ALLOCATED")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*< verifying incoming transaction >*\n\n` +
          `Beep! **₹${amount.toLocaleString()}** has been successfully deposited into the account of ${targetUser}.\n\n` +
          (promoted
            ? `🌟 *System note: Unit Status upgraded! Great job!* 🤖\n\n`
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
      .setTitle("💸 FUNDS WITHDRAWN")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*< verifying outgoing transaction >*\n\n` +
          `Notice: **₹${amount.toLocaleString()}** has been debited from the account of ${targetUser}.\n` +
          `The central ledger has been updated accordingly. 📉\n\n` +
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
    .setTitle("🗄️ INTERNAL MEMORY ARCHIVE")
    .setDescription(
      `*< accessing local storage volumes >*\n\n` +
        `Here is the data currently stored in my drives:\n\n` +
        `${lines}\n\n` +
        `*${divider()}*`,
    )
    .setFooter({ text: footerQuip() })
    .setTimestamp();
}

// ── Ticket Embeds ─────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`📝 SUPPORT TICKET LOGGED  ✦ Ticket #${count}`)
    .setDescription(
      `*< opening communication channel >*\n\n` +
        `Hello ${user}! 🤖 Your request has been securely filed.\n` +
        `Our human representatives have been notified and will be right with you.\n` +
        `Please detail any additional context while you wait. ☕\n\n` +
        `*${divider()}*`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "📁  Department",
        value: `${category.emoji} ${category.name}`,
        inline: true,
      },
      { name: "🔗  Requested By", value: `${user}`, inline: true },
    )
    .setFooter({
      text: "🤖 Oakawol Automation Unit • Client Support Division",
    })
    .setTimestamp();

  const keys = Object.keys(answers);
  if (keys.length > 0) {
    embed.addFields({
      name: "\u200B",
      value: `*${divider()}*\n📋  **Intake Form Data** *(for our records)* ✨`,
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
    .setTitle("💻 SUPPORT TERMINAL DIRECTORY")
    .setDescription(
      `*< loading department interface >*\n\n` +
        `Welcome to the support terminal! 🤖\n` +
        `Please select the department you wish to contact below.\n\n` +
        `${rows || "*No active departments discovered. 💤*"}\n\n` +
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
