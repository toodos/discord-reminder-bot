/**
 * utils/embeds.js
 * ♡ Centralized embed factories — cute, alive, and full of personality.
 */
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  success: 0x98f5a0, // soft mint green
  danger: 0xff6b8a, // bubblegum pink-red
  warning: 0xffd580, // warm pastel yellow
  info: 0xa78bfa, // lavender purple
  pink: 0xff85c2, // hot blossom pink
  gold: 0xffd166, // warm honey gold
  mint: 0x70e0c0, // fresh aqua mint
  sky: 0x7ec8e3, // dreamy sky blue
  peach: 0xffab7b, // soft peach
  lilac: 0xc9a7eb, // gentle lilac
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
  return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** A sparkly section divider */
function divider() {
  return "✦ ── ✦ ── ✦ ── ✦ ── ✦";
}

/** Pick a random cute closing footer message */
const FOOTER_QUIPS = [
  "♡ Oakawol Bot thinks you're absolutely wonderful~",
  "✨ Sprinkling fresh stardust on your whole entire day!",
  "🌸 Blooming with joy right alongside you~",
  "☁️ Fluffier than a cloud, softer than a wish!",
  "🍓 Stay sweet, stay magical, stay perfectly you~",
  "💖 Powered by love, fairy dust, and good vibes only!",
  "🌙 Wishing you the coziest, dreamiest night ever~",
  "🎀 Wrapped up with a ribbon — made just for you!",
  "🌷 Growing more sparkly with every passing moment~",
  "🍵 Remember to drink water and take little breaks ♡",
  "🧁 You deserve every cupcake in the whole wide world~",
  "⭐ You are doing SO amazingly, sweetie, keep going!",
  "🦋 Every single moment is a brand new beginning~",
  "🌈 Sending pure rainbow energy directly your way!",
  "🪄 A little sprinkle of magic goes such a long way~",
  "🍡 Life is sweeter when you share it with friends!",
  "💫 Keep shining bright, my darling little starlight~",
  "🌻 The sun always finds its way back out, I promise!",
  "🎶 Humming the happiest little tune just for you today!",
  "🐰 Hopping along and making today just a tiny bit cuter!",
];

function footerQuip() {
  return FOOTER_QUIPS[Math.floor(Math.random() * FOOTER_QUIPS.length)];
}

/**
 * Base embed with shared defaults — pastel pink, timestamp, cute footer.
 */
function base(color = COLORS.pink) {
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
    .setTitle("✦ Oopsie Daisy~ 🌸")
    .setDescription(
      `> 💭 *Hmm, something didn\'t go quite right...*\n\n` +
        `> ${content}\n\n` +
        `*${divider()}*\n` +
        `*Don\'t worry — these things happen to the best of us! Give it another try? 🌷*`,
    )
    .setFooter({
      text: "🌸 Mistakes are just little adventures in disguise~ You've got this!",
    })
    .setTimestamp();
}

// ── Tier Helper ───────────────────────────────────────────────────────────────

function getTier(balance) {
  if (balance >= 100000) return { icon: "💎", name: "Diamond" };
  if (balance >= 50000) return { icon: "👑", name: "Crown" };
  if (balance >= 10000) return { icon: "💳", name: "Gold" };
  if (balance >= 1000) return { icon: "💵", name: "Silver" };
  return { icon: "🪨", name: "Stone" };
}

// ── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
  return {
    file: asset("reminder.png"),
    embed: base(COLORS.lavender ?? COLORS.lilac)
      .setTitle("🌠 A Magical Promise Has Been Made~ ✨")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*✧ sealing it with a sparkle and a pinky-swear ✧*\n\n` +
          `I have carefully tucked your reminder into my memory ribbon~ 🎀\n` +
          `I pinky-promise to give **${targetUser.username}** the gentlest little nudge in **\`${timeStr}\`**!\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "🌸  The Promise", value: `\`\`\`${message}\`\`\`` },
        {
          name: "⏳  When I'll Whisper",
          value: `\`${timeStr}\``,
          inline: true,
        },
        {
          name: "📍  Where I'll Appear",
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
      .setTitle("🔔 *ding dong~!* Your Magical Alarm is Ringing! 🌸")
      .setThumbnail("attachment://reminder.png")
      .setDescription(
        `*✧ tapping you oh-so-gently on the shoulder ✧*\n\n` +
          `I remembered~! 🎀 Here's the little note you left for your future self:\n\n` +
          `> ### ✨ ${message}\n\n` +
          `*${divider()}*\n` +
          `*I hope you\'re having the loveliest, sparkliest day~ 🌷*`,
      )
      .setFooter({
        text: `🎀 Reminder conjured by ${initiatorTag} • Delivered right on time, with love!`,
      })
      .setTimestamp(),
  };
}

// ── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
  const unix = Math.floor(endTime / 1000);
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.sky)
      .setTitle("💤 Tuck-In Time~ Nighty Night! 🌙")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*✧ fluffing the pillows and dimming the fairy lights ✧*\n\n` +
          `🌙 **${targetUser.username}** is being gently tucked in for a cozy little rest~\n` +
          `Shhh, no disturbances please! They\'ll wake up all fresh and sparkly soon ✨\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        { name: "🌙  Nap Length", value: `\`${timeStr}\``, inline: true },
        { name: "☀️  Wake-Up Time", value: `<t:${unix}:T>`, inline: true },
        { name: "⏳  Zzz... Time Left", value: `<t:${unix}:R>`, inline: true },
        { name: "🎀  Tucked In By", value: `${initiator}`, inline: true },
      ),
  };
}

function cooldownExpiredEmbed(mention) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.mint)
      .setTitle("☀️ Good Morning, Sleepyhead~! 🌸✨")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*✧ swooshing open the curtains and flooding the room with sunshine ✧*\n\n` +
          `🌟 Rise and shine, ${mention}!\n` +
          `Your cozy little cooldown nap is all done~ You\'re refreshed, you\'re glowing,\n` +
          `and you\'re absolutely ready to sparkle again! Go get \'em! 💪🌸\n\n` +
          `*${divider()}*`,
      ),
  };
}

function cooldownRemovedEmbed(targetUser) {
  return {
    file: asset("cooldown.png"),
    embed: base(COLORS.success)
      .setTitle("🎉 Surprise Early Release~! ✨")
      .setThumbnail("attachment://cooldown.png")
      .setDescription(
        `*✧ sneaking in quietly and opening the curtains a little early ✧*\n\n` +
          `🌈 What a lovely surprise! All cooldowns for ${targetUser} have been\n` +
          `whisked away like morning mist on a sunny day~ They\'re up, they\'re bright,\n` +
          `and they\'re absolutely ready to dazzle the entire world! ✨🌸\n\n` +
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
        name: `✦ ${targetUser.username}'s Treasure Chest ✦`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail("attachment://balance.png")
      .setDescription(
        `*✧ lifting the lid on a glittering chest with a satisfying creak ✧*\n\n` +
          `### 🏆  Wall of Wealthy Wonders\n` +
          (leaderboardStr ||
            "*No treasure hunters yet — be the first to claim glory!* 🌱") +
          `\n\n*${divider()}*`,
      )
      .addFields(
        {
          name: `${tier.icon}  Treasure Hoard`,
          value: `\`\`\`₹${balance.toLocaleString()}\`\`\``,
          inline: true,
        },
        {
          name: "📈  Global Standing",
          value: `\`\`\`#${rank}\`\`\``,
          inline: true,
        },
        {
          name: "🏅  Prestige Tier",
          value: `\`${tier.icon} ${tier.name}\``,
          inline: true,
        },
      )
      .setFooter({
        text: `💰 ₹${totalEconomy.toLocaleString()} glittering in the world economy  •  ${footerQuip()}`,
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
      .setTitle("🪙 Coins Are Raining Down~! 💸✨")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*✧ golden coins come tumbling joyfully from the sky ✧*\n\n` +
          `🎊 **₹${amount.toLocaleString()}** is fluttering its way into ${targetUser}\'s treasure chest!\n\n` +
          (promoted
            ? `🌟 *Ooooh~! They just soared to a shiny brand new wealth tier!* 🎉\n\n`
            : "") +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💰  New Hoard Total",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Prestige Tier", value: tierLine, inline: true },
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
      .setTitle("🏦 A Gentle Vault Withdrawal~ 🌸")
      .setThumbnail("attachment://money.png")
      .setDescription(
        `*✧ carefully lifting coins from the velvet-lined vault ✧*\n\n` +
          `🌷 **₹${amount.toLocaleString()}** has been gracefully removed from ${targetUser}\'s treasury.\n` +
          `Every coin accounted for, every ribbon still perfectly in place~\n\n` +
          `*${divider()}*`,
      )
      .addFields(
        {
          name: "💰  Remaining Hoard",
          value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`,
          inline: true,
        },
        { name: "🏅  Prestige Tier", value: tierLine, inline: true },
      ),
  };
}

// ── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
  const slotEmojis = ["🍓", "🍊", "💙", "💜"];
  const lines = [1, 2, 3, 4]
    .map((slot, i) => {
      const msg = slots[slot];
      const preview = msg
        ? msg.length > 55
          ? msg.slice(0, 52) + "..."
          : msg
        : "*~ empty, waiting for a secret ~*";
      const charCnt = msg ? `\`${msg.length} chars\`` : "`0 chars`";
      return `${slotEmojis[i]}  **Slot ${slot}:** ${preview} — ${charCnt}`;
    })
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.lilac)
    .setTitle("📖 Peeking Into My Magical Notebook~ ✨")
    .setDescription(
      `*✧ gently unclasping the little star-shaped lock on a tiny velvet journal ✧*\n\n` +
        `Here are all the little things I\'ve been keeping extra safe for you:\n\n` +
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
    .setTitle(`🎀 Welcome to Your Cozy Little Corner~! 🌸  ✦ Ticket #${count}`)
    .setDescription(
      `*✧ hanging up the little "We\'re Happy to Help!" sign just for you ✧*\n\n` +
        `Hello hello, ${user}! 🌷 You\'ve stepped into the warmest, sparkliest help-desk in town!\n` +
        `Our lovely team has been notified and will float over shortly —\n` +
        `feel free to share everything on your mind while you wait~ 💕\n\n` +
        `*${divider()}*`,
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "📂  Category",
        value: `${category.emoji} ${category.name}`,
        inline: true,
      },
      { name: "🌸  Opened By", value: `${user}`, inline: true },
    )
    .setFooter({
      text: "🎀 Oakawol Support Desk • No worry is too small, we genuinely love to help~!",
    })
    .setTimestamp();

  const keys = Object.keys(answers);
  if (keys.length > 0) {
    embed.addFields({
      name: "\u200B",
      value: `*${divider()}*\n📝  **Your Form Answers** *(so we can help you even faster!)* ✨`,
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
    .setColor(COLORS.gold)
    .setTitle("🌟 Welcome to the Magical Help Shoppe~! ✨")
    .setDescription(
      `*✧ the little bell above the door jingles as you step inside ✧*\n\n` +
        `Here\'s what we can help you with today — choose whatever feels right! 🌸\n\n` +
        `${rows || "*Hmm, the shelves are empty right now~ Check back soon!* 🌱"}\n\n` +
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
