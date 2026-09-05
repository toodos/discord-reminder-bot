/**
 * utils/embeds.js
 * 🏛️ Centralized embed factories — Dark Luxury & Obsidian Gold Theme.
 * Ultra-sleek matte obsidian, champagne gold, and platinum prestige.
 */
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

// ── Palette (Dark Luxury & Obsidian Gold) ────────────────────────────────────
const COLORS = {
  // Brand accents
  gold: 0xD4AF37,      // Imperial Champagne Gold (Primary Brand Accent)
  champagne: 0xF3E5AB, // Soft Luminous Champagne
  obsidian: 0x0F172A,  // Deep Obsidian Slate
  platinum: 0xE2E8F0,  // Refined Platinum Silver
  bronze: 0xCD7F32,    // Polished Warm Bronze
  emerald: 0x10B981,   // Royal Emerald
  ruby: 0xEF4444,      // Crimson Ruby
  sapphire: 0x3B82F6,  // Royal Sapphire
  amethyst: 0xA855F7,  // Royal Amethyst

  // Functional aliases
  success: 0x10B981,   // Emerald Green
  danger: 0xEF4444,    // Crimson Ruby
  warning: 0xF59E0B,   // Amber Gold
  info: 0xD4AF37,      // Champagne Gold
  pink: 0xE11D48,      // Rose Noir
  mint: 0x10B981,      // Emerald Green
  sky: 0xD4AF37,       // Imperial Gold
  peach: 0xF59E0B,     // Warm Amber Gold
  lilac: 0xA855F7,     // Imperial Amethyst
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
  return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** An ultra-sleek luxury divider line */
function divider() {
  return "◈ ━━━━━━━━ ◈ ━━━━━━━━ ◈";
}

/** Random executive footer messages */
const FOOTER_QUIPS = [
  "◈ Oakawol Private Suite • Precision & Prestige",
  "❖ Obsidian Ledger • Encrypted with absolute fidelity",
  "🏛️ Private Wealth Management • All reserves secured",
  "✨ Crafted with distinction and executive grace",
  "👑 Premier Concierge • At your distinguished service",
  "⚜️ Imperial Records • Verified and immutable",
  "💎 Reserve Status: Optimal • Excellence delivered",
  "◈ Discretion guaranteed • Operating at highest tier",
  "🥂 Welcome to the Executive Circle",
  "💼 Portfolio updated with flawless accuracy",
  "🏛️ Sovereign Treasury synchronized",
  "🗝️ Master cipher authenticated • Access granted",
  "⭐ Serving the server's distinguished members",
  "📜 Signed and sealed in obsidian ink",
  "✨ Elevating your server experience to pure luxury",
  "⚜️ Curated exclusively for the elite",
  "◈ Private Vault Access • Clearance Level 1",
  "💼 Execution complete • Flawless discretion",
];

function footerQuip() {
  return FOOTER_QUIPS[Math.floor(Math.random() * FOOTER_QUIPS.length)];
}

/**
 * Base embed with shared defaults — champagne gold trim, timestamp, executive footer.
 */
function base(color = COLORS.gold) {
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
    .setTitle("⚠️  Executive Advisory")
    .setDescription(
      `> ◈ *An unexpected anomaly was encountered...*\n\n` +
        `> ${content}\n\n` +
        `*${divider()}*\n` +
        `*Please verify your parameters and re-submit your request.*`,
    )
    .setFooter({
      text: "🗝️ System Diagnostics • Obsidian Advisory",
    })
    .setTimestamp();
}

// ── Tier Helper ───────────────────────────────────────────────────────────────

function getTier(balance) {
  if (balance >= 100000) return { icon: "👑", name: "Sovereign Executive" };
  if (balance >= 50000) return { icon: "💎", name: "Grand Benefactor" };
  if (balance >= 10000) return { icon: "🏛️", name: "High Chancellor" };
  if (balance >= 1000) return { icon: "💼", name: "Elite Associate" };
  return { icon: "◈", name: "Distinguished Member" };
}

// ── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
  return {
    file: asset("reminder.png"),
    embed: base(COLORS.gold)
      .setTitle("⏳  Priority Reminder Scheduled")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*◈ Protocol established. Notice logged to the executive chronometer.*\n\n` +
          `A discreet reminder has been configured for **${targetUser.username}** in **\`${timeStr}\`**.\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "📝  Memo Details", value: `\`\`\`${message}\`\`\`` },
        {
          name: "⏱️  Execution Horizon",
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
      .setTitle("🛎️  Priority Notice • Scheduled Reminder")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*◈ Executive alert dispatched to target recipient.*\n\n` +
          `> **${message}**\n\n` +
          `*${divider()}*`,
      )
      .setFooter({
        text: `✨ Scheduled by ${initiatorTag} • Oakawol Concierge Suite`,
      })
      .setTimestamp(),
  };
}

// ── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
  const unix = Math.floor(endTime / 1000);
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.gold)
      .setTitle("⏸️  Executive Recess Initiated")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*◈ Chamber sealed. Temporary recess now in effect.*\n\n` +
          `**${targetUser.username}** has transitioned to the private stasis lounge. All standard privileges are suspended until recess concludes.\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "⏳  Duration", value: `\`${timeStr}\``, inline: true },
        { name: "⏱️  End Horizon", value: `<t:${unix}:T>`, inline: true },
        { name: "⌛  Time Left", value: `<t:${unix}:R>`, inline: true },
        { name: "🛡️  Authorized Official", value: `${initiator}`, inline: true },
      ),
  };
}

function cooldownExpiredEmbed(mention) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.success)
      .setTitle("✨  Executive Recess Concluded")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*◈ Private lounge chamber unsealed. Privileges fully restored.*\n\n` +
          `Welcome back, ${mention}. All account clearances have resumed optimal status.\n\n` +
          `*${divider()}*`,
      ),
  };
}

function cooldownRemovedEmbed(targetUser) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.emerald)
      .setTitle("🔓  Executive Clearance Override")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*⚠️ Administrative pardon executed by authorized official.*\n\n` +
          `Standard access privileges have been immediately restored to **${targetUser}**.\n\n` +
          `*${divider()}*`,
      ),
  };
}

// ── Economy Embeds ───────────────────────────────────────────────────────────

function formatTransactionHistory(transactions) {
  if (!transactions || transactions.length === 0) {
    return "*No recent transactions recorded.*";
  }

  return transactions
    .map((tx) => {
      const isAdd = tx.type === "ADD";
      const icon = isAdd ? "🟢" : "🔴";
      const sign = isAdd ? "+" : "-";
      const unixTime = Math.floor(tx.timestamp / 1000);
      const timeStr = `<t:${unixTime}:R>`;
      const reasonStr = tx.reason ? ` • *${tx.reason}*` : "";
      const executorStr = tx.executorId ? ` (by <@${tx.executorId}>)` : "";

      return `${icon} **${sign}₹${tx.amount.toLocaleString()}** (${timeStr})${reasonStr}${executorStr}\n└ *Holdings: ₹${tx.newBalance.toLocaleString()}*`;
    })
    .join("\n");
}

function balanceEmbed(
  client,
  targetUser,
  balance,
  rank,
  leaderboardStr,
  totalEconomy,
  transactions = []
) {
  const tier = getTier(balance);
  const historyFormatted = formatTransactionHistory(transactions);

  return {
    file: asset("balance.png"),
    embed: new EmbedBuilder()
      .setColor(COLORS.gold)
      .setAuthor({
        name: `🏛️ ${targetUser.username}'s Sovereign Portfolio`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("attachment://balance.png")
      .setDescription(
        `*◈ Accessing encrypted sovereign accounts... Clearance: Verified.*\n\n` +
          `### 🏆  High-Net-Worth Benefactors\n` +
          (leaderboardStr || "*No active user records found.*") +
          `\n\n*${divider()}*`,
      )
      .addFields(
        {
          name: `${tier.icon}  Vault Holdings`,
          value: `\`\`\`₹${balance.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: "📈  Rank",
          value: `\`\`\`#${rank}\`\`\``,
          inline: true,
        },
        {
          name: "🏅  Prestige Standing",
          value: `\`${tier.icon} ${tier.name}\``,
          inline: true,
        },
        {
          name: "📜  Recent Ledger Audit",
          value: historyFormatted,
          inline: false,
        }
      )
      .setFooter({
        text: `💰 ₹${totalEconomy.toLocaleString()} held in server reserves  •  ${footerQuip()}`,
      })
      .setTimestamp(),
  };
}

function addMoneyEmbed(targetUser, amount, oldBalance, newBalance, transactions = []) {
  const tier = getTier(newBalance);
  const oldTier = getTier(oldBalance);
  const promoted = oldTier.name !== tier.name;
  const tierLine = promoted
    ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} **${tier.name}** 🎉`
    : `${tier.icon} ${tier.name}`;

  const historyFormatted = formatTransactionHistory(transactions);

  return {
    file: asset("money.png"),
    embed: base(COLORS.success)
      .setTitle("💵  Treasury Capital Deposited")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*◈ Vault records updated. Capital transfer verified.*\n\n` +
          `Allocated **₹${amount.toLocaleString()}** into the portfolio of ${targetUser}.\n\n` +
          (promoted
            ? `👑 *Imperial Decree: Executive Prestige elevated!* \n\n`
            : "") +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Total Portfolio",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Prestige Standing", value: tierLine, inline: true },
        {
          name: "📜  Recent Ledger Audit",
          value: historyFormatted,
          inline: false,
        }
      ),
  };
}

// ── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
  const slotEmojis = ["🏛️", "📜", "🗝️", "💎"];
  const lines = [1, 2, 3, 4]
    .map((slot, i) => {
      const msg = slots[slot];
      const preview = msg
        ? msg.length > 55
          ? msg.slice(0, 52) + "..."
          : msg
        : "*[ empty encrypted sector ]*";
      const charCnt = msg ? `\`${msg.length} chars\`` : "`0 chars`";
      return `${slotEmojis[i]}  **Sector ${slot}:** ${preview} — ${charCnt}`;
    })
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle("🏛️  Obsidian Archive • Encrypted Records")
    .setDescription(
      `*◈ Reading secure memory vaults... Integrity: Flawless.*\n\n` +
        `Here are the records currently stored in the confidential archives:\n\n` +
        `${lines}\n\n` +
        `*${divider()}*`,
    )
    .setFooter({ text: footerQuip() })
    .setTimestamp();
}

function removeMoneyEmbed(targetUser, amount, oldBalance, newBalance, transactions = []) {
  const tier = getTier(newBalance);
  const oldTier = getTier(oldBalance);
  const demoted = oldTier.name !== tier.name;
  const tierLine = demoted
    ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} ${tier.name}`
    : `${tier.icon} ${tier.name}`;

  const historyFormatted = formatTransactionHistory(transactions);

  return {
    file: asset("money.png"),
    embed: base(COLORS.warning)
      .setTitle("💸  Treasury Capital Disbursed")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*◈ Vault records updated. Capital deduction verified.*\n\n` +
          `Debited **₹${amount.toLocaleString()}** from the portfolio of ${targetUser}.\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Remaining Holdings",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Prestige Standing", value: tierLine, inline: true },
        {
          name: "📜  Recent Ledger Audit",
          value: historyFormatted,
          inline: false,
        }
      ),
  };
}

function historyEmbed(targetUser, balance, transactions = []) {
  const tier = getTier(balance);
  const historyFormatted = formatTransactionHistory(transactions);

  const embed = base(COLORS.gold)
    .setAuthor({
      name: `📜 Audit Ledger for ${targetUser.username}`,
      iconURL: targetUser.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail("attachment://money.png")
    .setDescription(
      `*◈ Decrypting sovereign financial journal logs...*\n\n` +
        `Current Holdings: **₹${balance.toLocaleString()}** (${tier.icon} ${tier.name})\n\n` +
        `*${divider()}*`,
    )
    .addFields({
      name: "📋  Recent Journal Activity",
      value: historyFormatted,
      inline: false,
    });

  return {
    file: asset("money.png"),
    embed,
  };
}

// ── Ticket Embeds ─────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`✉️  Executive Concierge Terminal  •  #${count}`)
    .setDescription(
      `*◈ Confidential communication terminal established.*\n\n` +
        `Greetings ${user}. Your request has been registered in the executive queue.\n` +
        `Our concierge team has been paged and will attend to your inquiry shortly.\n` +
        `Please state your request and any pertinent details below. 🥂\n\n` +
        `*${divider()}*`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "📁  Department",
        value: `${category.emoji} ${category.name}`,
        inline: true,
      },
      { name: "👤  Client Member", value: `${user}`, inline: true },
    )
    .setFooter({
      text: "👑 Oakawol Executive Concierge Suite",
    })
    .setTimestamp();

  const keys = Object.keys(answers);
  if (keys.length > 0) {
    embed.addFields({
      name: "\u200B",
      value: `*${divider()}*\n📋  **Intake Dossier** *(Pre-filled Details)*`,
    });
    embed.addFields(
      keys.map((k) => ({
        name: `◈ ${k}`,
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
    .setColor(COLORS.gold)
    .setTitle("🏛️  Executive Directory • Specialized Departments")
    .setDescription(
      `*◈ Querying private concierge sectors...*\n\n` +
        `Select the specialized department you wish to contact below:\n\n` +
        `${rows || "*No active departments cataloged.*"}\n\n` +
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
  historyEmbed,
  memoryListEmbed,
  ticketWelcomeEmbed,
  categoryListEmbed,
};
