/**
 * utils/embeds.js
 * ⚡ Centralized embed factories — neon, digital, and cyberpunk.
 */
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  success: 0x00ffcc, // neon cyan
  danger: 0xff003c, // electric crimson
  warning: 0xffbf00, // amber phosphor
  info: 0x0088ff, // deep link blue
  pink: 0xff00ff, // hot magenta
  gold: 0xffd700, // cyber gold
  mint: 0x39ff14, // toxic green
  sky: 0x00f0ff, // terminal cyan
  peach: 0xff5e00, // overdrive orange
  lilac: 0x9d00ff, // synthwave purple
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
  return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** A digital interface divider */
function divider() {
  return "⚡ ── ⚡ ── ⚡ ── ⚡ ── ⚡";
}

/** Pick a random cyber closing footer message */
const FOOTER_QUIPS = [
  "⚡ Oakawol System AI operating at 100% capacity.",
  "🌐 Data streams synchronized across all nodes.",
  "💾 Memories successfully written to the mainframe.",
  "🔧 Cybernetic systems calibrated.",
  "🔋 Energy reserves optimal.",
  "🌌 Navigating the outer limits of the net.",
  "👾 Glitches patched, protocols enforced.",
  "📡 Signal established. Connection secure.",
  "💻 Bypassing local firewalls...",
  "🗑️ Cached data cleared.",
  "⚙️ Maintenance subroutines active.",
  "🔗 Encrypted network handshake successful.",
  "🚀 Thrusters primed and ready.",
  "🧠 Neural interface linked.",
  "📈 Diagnostics read green across the board.",
  "🧬 Upgrading system DNA.",
  "🛡️ Firewall integrity at 100%.",
  "💽 Reading localized data sectors.",
  "⚡ Surfing the neon grid.",
  "🤖 Synthetic logic parameters functioning normally."
];

function footerQuip() {
  return FOOTER_QUIPS[Math.floor(Math.random() * FOOTER_QUIPS.length)];
}

/**
 * Base embed with shared defaults — terminal cyan, timestamp, cyber footer.
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
    .setTitle("⚠️ SYSTEM FATAL EXCEPTION")
    .setDescription(
      `> 💻 *CRITICAL ERROR IN SUBROUTINE...*\n\n` +
        `> ${content}\n\n` +
        `*${divider()}*\n` +
        `*Diagnostic recommended. Please reboot the sequence and try again.*`,
    )
    .setFooter({
      text: "⚡ Core dump analyzed. System recovery initiated.",
    })
    .setTimestamp();
}

// ── Tier Helper ───────────────────────────────────────────────────────────────

function getTier(balance) {
  if (balance >= 100000) return { icon: "💎", name: "Apex Protocol" };
  if (balance >= 50000) return { icon: "🌐", name: "Network Overlord" };
  if (balance >= 10000) return { icon: "📈", name: "Data Broker" };
  if (balance >= 1000) return { icon: "💻", name: "Netrunner" };
  return { icon: "🔌", name: "Terminal User" };
}

// ── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
  return {
    file: asset("reminder.png"),
    embed: base(COLORS.lilac)
      .setTitle("⏰ SYSTEM OVERRIDE: ROUTINE SCHEDULED")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*< establishing temporal beacon in the mainframe >*\n\n` +
          `Event trigger registered. I have partitioned local memory. 💾\n` +
          `Execution sequence for **${targetUser.username}** will deploy in **\`${timeStr}\`**!\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "📁  Data Payload", value: `\`\`\`${message}\`\`\`` },
        {
          name: "⏱️  Execution Time",
          value: `\`${timeStr}\``,
          inline: true,
        },
        {
          name: "📡  Target Node",
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
      .setTitle("⚠️ NOTIFICATION TRIGGERED")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*< decrypting temporal payload >*\n\n` +
          `Alert sequence active! ⚡ Pinging your neural link with the following packet:\n\n` +
          `> ### 🌐 ${message}\n\n` +
          `*${divider()}*\n` +
          `*Transmission complete. Connection terminated.*`,
      )
      .setFooter({
        text: `⚡ Task queued by ${initiatorTag} • Deployed with microsecond precision.`,
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
      .setTitle("💤 CRYOSLEEP POD ACTIVATED")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< powering down auxiliary systems >*\n\n` +
          `🔌 **${targetUser.username}** is entering hibernation protocol.\n` +
          `Neural activity minimizing to conserve battery life until wake condition is met. ⚡\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "🔋  Recharge Duration", value: `\`${timeStr}\``, inline: true },
        { name: "⚡  Activation Cycle", value: `<t:${unix}:T>`, inline: true },
        { name: "⏳  Cycles Remaining", value: `<t:${unix}:R>`, inline: true },
        { name: "🛡️  Authorized By", value: `${initiator}`, inline: true },
      ),
  };
}

function cooldownExpiredEmbed(mention) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.success)
      .setTitle("☀️ HIBERNATION PROTOCOL COMPLETE")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< ramping power to main thrusters >*\n\n` +
          `⚡ System online, ${mention}!\n` +
          `Battery levels are at 100%. Diagnostic checks report optimal performance.\n` +
          `You are cleared to access the grid. 🌐💻\n\n` +
          `*${divider()}*`,
      ),
  };
}

function cooldownRemovedEmbed(targetUser) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.mint)
      .setTitle("🔓 MANUAL OVERRIDE: CRYOSLEEP ABORTED")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*< emergency wake sequence initiated >*\n\n` +
          `⚡ Administrator privileges have bypassed the sleep cycle for ${targetUser}.\n` +
          `Auxiliary power instantly restored. Local systems are fully operational on the neon grid.\n\n` +
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
      .setColor(COLORS.gold)
      .setAuthor({
        name: `⚡ ${targetUser.username}'s Data Vault ⚡`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("attachment://balance.png")
      .setDescription(
        `*< querying secure data ledgers >*\n\n` +
          `### 🌐  The Elite Netrunner Board\n` +
          (leaderboardStr ||
             "*Grid network empty — waiting for local connections!* 🔌") +
          `\n\n*${divider()}*`,
      )
      .addFields(
        {
          name: `${tier.icon}  Rupee Balance`,
          value: `\`\`\`₹${balance.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: "📈  Network Rank",
          value: `\`\`\`#${rank}\`\`\``,
          inline: true,
        },
        {
          name: "🏅  Clearance Level",
          value: `\`${tier.icon} ${tier.name}\``,
          inline: true,
        },
      )
      .setFooter({
        text: `💰 ₹${totalEconomy.toLocaleString()} circulating in the mainframe  •  ${footerQuip()}`,
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
    embed: base(COLORS.mint)
      .setTitle("💵 INCOMING DATA TRANSFER")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*< decrypting secure transaction hashes >*\n\n` +
          `⚡ **₹${amount.toLocaleString()}** successfully routed to ${targetUser}\'s private vault!\n\n` +
          (promoted
            ? `🌐 *System alert: Clearance Level upgraded! Authorized for deeper access.* 🔌\n\n`
            : "") +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Vault Total",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Clearance Level", value: tierLine, inline: true },
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
      .setTitle("💸 OUTGOING SECURE TRANSFER")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*< compiling outgoing transaction payload >*\n\n` +
          `⚡ **₹${amount.toLocaleString()}** has been deducted from ${targetUser}\'s balance.\n` +
          `Account synchronized with the global ledger. 📉\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💾  Remaining Balance",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Clearance Level", value: tierLine, inline: true },
      ),
  };
}

// ── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
  const slotEmojis = ["💾", "🔌", "🔋", "⚙️"];
  const lines = [1, 2, 3, 4]
    .map((slot, i) => {
      const msg = slots[slot];
      const preview = msg
        ? msg.length > 55
          ? msg.slice(0, 52) + "..."
          : msg
        : "*[ unallocated sector limits ]*";
      const charCnt = msg ? `\`${msg.length} bits\`` : "`0 bits`";
      return `${slotEmojis[i]}  **Slot ${slot}:** ${preview} — ${charCnt}`;
    })
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.lilac)
    .setTitle("🗄️ ACCESSING ENCRYPTED MAINFRAME")
    .setDescription(
      `*< bypassing local firewalls for memory access >*\n\n` +
        `Current data held in secure partitions:\n\n` +
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
    .setTitle(`🌐 PRIVATE CHANNEL ESTABLISHED  ✦ Support Thread #${count}`)
    .setDescription(
      `*< encrypting line with end-to-end 256-bit security >*\n\n` +
        `Connection successful, ${user}. ⚡ You have entered a secure admin sector.\n` +
        `Operators have been pinged and will jack in shortly to assist you.\n` +
        `Please input any required data while you wait. 💻\n\n` +
        `*${divider()}*`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "📁  Protocol",
        value: `${category.emoji} ${category.name}`,
        inline: true,
      },
      { name: "🔗  Connected By", value: `${user}`, inline: true },
    )
    .setFooter({
      text: "⚡ Oakawol Operating System • Corporate Help Desk",
    })
    .setTimestamp();

  const keys = Object.keys(answers);
  if (keys.length > 0) {
    embed.addFields({
      name: "\u200B",
      value: `*${divider()}*\n📝  **Form Input Data** *(parsed for system admins)* ⚡`,
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
    .map((c) => `${c.emoji}  **${c.name}**  \`NODE: ${c.id}\``)
    .join("\n");

  return new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle("💻 SYSTEM TERMINAL ACCESS")
    .setDescription(
      `*< initializing interactive command UI >*\n\n` +
        `Select a network node below to initiate a private connection. ⚡\n\n` +
        `${rows || "*No active network nodes. Servers offline.* 🔌"}\n\n` +
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
