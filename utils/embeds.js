/**
 * utils/embeds.js
 * ♡ Centralized embed factories — cute, alive, and full of personality.
 */
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
    success:  0x98F5A0,   // soft mint green
    danger:   0xFF6B8A,   // bubblegum pink-red
    warning:  0xFFD580,   // warm pastel yellow
    info:     0xA78BFA,   // lavender purple
    pink:     0xFF85C2,   // hot blossom pink
    gold:     0xFFD166,   // warm honey gold
    mint:     0x70E0C0,   // fresh aqua mint
    sky:      0x7EC8E3,   // dreamy sky blue
    peach:    0xFFAB7B,   // soft peach
    lilac:    0xC9A7EB,   // gentle lilac
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function asset(name) {
    return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

/** A sparkly section divider */
function divider() {
    return '✦ ── ✦ ── ✦ ── ✦ ── ✦';
}

/** Pick a random cute closing footer message */
const FOOTER_QUIPS = [
    '♡ Oakawol Bot loves you!',
    '✨ Have a sparkly day~',
    '🌸 Stay cute, stay cozy!',
    '☁️ Delivered with cloud-speed!',
    '🍓 Sweet as always~',
    '💖 Your friendly neighborhood bot!',
    '🌙 Wishing you a dreamy day!',
    '🎀 Tied with a ribbon, just for you!',
    '🌷 Growing alongside you~',
    '🍵 Stay warm and hydrated!',
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

/** Standard error embed */
function errorEmbed(content) {
    return new EmbedBuilder()
        .setColor(COLORS.danger)
        .setTitle('✦ Uh oh! Something went wrong~')
        .setDescription(`> ${content}`)
        .setFooter({ text: '🌸 Don\'t worry, try again!' })
        .setTimestamp();
}

function getTier(balance) {
    if (balance >= 100000) return { icon: '💎', name: 'Diamond' };
    if (balance >= 50000)  return { icon: '👑', name: 'Crown'   };
    if (balance >= 10000)  return { icon: '💳', name: 'Gold'    };
    if (balance >= 1000)   return { icon: '💵', name: 'Silver'  };
    return                        { icon: '🪨', name: 'Stone'   };
}

// ── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
    return {
        file: asset('reminder.png'),
        embed: base(COLORS.lavender ?? COLORS.lilac)
            .setTitle('⏰  Reminder Scheduled! ✨')
            .setThumbnail('attachment://reminder.png')
            .setDescription(
                `✦ Got it! I'll give **${targetUser.username}** a little nudge in **\`${timeStr}\`**!\n\n` +
                `*${divider()}*`
            )
            .addFields(
                { name: '📝  What to remember', value: `\`\`\`${message}\`\`\`` },
                { name: '⏳  Time', value: `\`${timeStr}\``, inline: true },
                { name: '📍  Channel', value: `${targetChannel}`, inline: true }
            ),
    };
}

function reminderFiredEmbed(message, initiatorTag) {
    return {
        file: asset('reminder.png'),
        embed: new EmbedBuilder()
            .setColor(COLORS.warning)
            .setTitle('🔔  Ding-dong~! Your Reminder! 🌸')
            .setThumbnail('attachment://reminder.png')
            .setDescription(
                `*Rise and shine!* Here's what you wanted to remember:\n\n` +
                `> ### ${message}\n\n` +
                `*${divider()}*`
            )
            .setFooter({ text: `⏰ Set by ${initiatorTag} • Delivered on time!` })
            .setTimestamp(),
    };
}

// ── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
    const unix = Math.floor(endTime / 1000);
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.sky)
            .setTitle('💤  Nap Time!')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(
                `🌙 **${targetUser.username}** is taking a well-deserved rest~\n` +
                `They'll be back before you know it!\n\n*${divider()}*`
            )
            .addFields(
                { name: '🌙  Duration', value: `\`${timeStr}\``, inline: true },
                { name: '☀️  Wakes at', value: `<t:${unix}:T>`, inline: true },
                { name: '⏳  Remaining', value: `<t:${unix}:R>`, inline: true },
                { name: '👤  Put to sleep by', value: `${initiator}`, inline: true }
            ),
    };
}

function cooldownExpiredEmbed(mention) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.mint)
            .setTitle('☀️  Rise and Shine! 🌸')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(
                `🌟 Wake up ${mention}!\n` +
                `Your cooldown has ended — you're fresh and ready to go!\n\n` +
                `*${divider()}*`
            ),
    };
}

function cooldownRemovedEmbed(targetUser) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.success)
            .setTitle('✨  Early Awakening!')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(
                `🎉 Successfully cleared cooldowns for ${targetUser}.\n` +
                `They're wide awake and ready for action!\n\n` +
                `*${divider()}*`
            ),
    };
}

// ── Economy Embeds ───────────────────────────────────────────────────────────

function balanceEmbed(client, targetUser, balance, rank, leaderboardStr, totalEconomy) {
    const tier = getTier(balance);
    return {
        file: asset('balance.png'),
        embed: new EmbedBuilder()
            .setColor(COLORS.gold)
            .setAuthor({
                name: `✦ ${targetUser.username}'s Vault`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail('attachment://balance.png')
            .setDescription(
                `### 🏆  Global Leaderboard\n` +
                (leaderboardStr || '*No records yet — be the first!* 🌱') +
                `\n\n*${divider()}*`
            )
            .addFields(
                { name: `${tier.icon}  Wealth`,     value: `\`\`\`₹${balance.toLocaleString()}\`\`\``,  inline: true },
                { name: '📈  Global Rank',           value: `\`\`\`#${rank}\`\`\``,                      inline: true },
                { name: '🏅  Tier',                  value: `\`${tier.icon} ${tier.name}\``,             inline: true }
            )
            .setFooter({ text: `💰 Total economy: ₹${totalEconomy.toLocaleString()} in circulation  •  ${footerQuip()}` })
            .setTimestamp(),
    };
}

function addMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
    const tier    = getTier(newBalance);
    const oldTier = getTier(oldBalance);
    const promoted = oldTier.name !== tier.name;
    const tierLine = promoted
        ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} **${tier.name}** 🎉`
        : `${tier.icon} ${tier.name}`;

    return {
        file: asset('money.png'),
        embed: base(COLORS.mint)
            .setTitle('💸  Funds Deposited!')
            .setThumbnail('attachment://money.png')
            .setDescription(
                `✅ **₹${amount.toLocaleString()}** has been added to ${targetUser}'s vault!\n\n` +
                (promoted ? `✨ *They just levelled up their wealth tier!*\n\n` : '') +
                `*${divider()}*`
            )
            .addFields(
                { name: '💰  New Balance', value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`, inline: true },
                { name: '🏅  Tier',        value: tierLine, inline: true }
            ),
    };
}

function removeMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
    const tier    = getTier(newBalance);
    const oldTier = getTier(oldBalance);
    const demoted = oldTier.name !== tier.name;
    const tierLine = demoted
        ? `${oldTier.icon} ${oldTier.name}  →  ${tier.icon} ${tier.name}`
        : `${tier.icon} ${tier.name}`;

    return {
        file: asset('money.png'),
        embed: base(COLORS.peach)
            .setTitle('🏦  Funds Withdrawn!')
            .setThumbnail('attachment://money.png')
            .setDescription(
                `📤 **₹${amount.toLocaleString()}** has been removed from ${targetUser}'s vault.\n\n` +
                `*${divider()}*`
            )
            .addFields(
                { name: '💰  New Balance', value: `\`₹${oldBalance.toLocaleString()}\`  →  **₹${newBalance.toLocaleString()}**`, inline: true },
                { name: '🏅  Tier',        value: tierLine, inline: true }
            ),
    };
}

// ── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
    const slotEmojis = ['🍓', '🍊', '💙', '💜'];
    const lines = [1, 2, 3, 4].map((slot, i) => {
        const msg     = slots[slot];
        const preview = msg ? (msg.length > 55 ? msg.slice(0, 52) + '...' : msg) : '*Empty slot*';
        const charCnt = msg ? `\`${msg.length} chars\`` : '`0 chars`';
        return `${slotEmojis[i]}  **Slot ${slot}:** ${preview} — ${charCnt}`;
    }).join('\n\n');

    return new EmbedBuilder()
        .setColor(COLORS.lilac)
        .setTitle('🧠  Bot Memory Slots')
        .setDescription(`${lines}\n\n*${divider()}*`)
        .setFooter({ text: footerQuip() })
        .setTimestamp();
}

// ── Ticket Embeds ─────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`🎫  Ticket #${count}  •  ${category.emoji} ${category.name}`)
        .setDescription(
            `Welcome ${user}! 🌸\n` +
            `Our support team has been notified and will be with you shortly.\n` +
            `Please describe your issue in detail and we'll help ASAP!\n\n` +
            `*${divider()}*`
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '📂  Category', value: `${category.emoji} ${category.name}`, inline: true },
            { name: '👤  Opened by', value: `${user}`, inline: true }
        )
        .setFooter({ text: '🎀 Oakawol Support • We\'re happy to help!' })
        .setTimestamp();

    const keys = Object.keys(answers);
    if (keys.length > 0) {
        embed.addFields({ name: '\u200B', value: `*${divider()}*\n📝  **Form Responses**` });
        embed.addFields(keys.map(k => ({ name: `❓ ${k}`, value: `> ${answers[k]}`, inline: false })));
    }
    return embed;
}

function categoryListEmbed(categories) {
    const rows = categories.map(c =>
        `${c.emoji}  **${c.name}**  \`ID: ${c.id}\``
    ).join('\n');

    return new EmbedBuilder()
        .setColor(COLORS.gold)
        .setTitle('📋  Ticket Categories')
        .setDescription(`${rows || '*No categories yet!*'}\n\n*${divider()}*`)
        .setFooter({ text: footerQuip() })
        .setTimestamp();
}

module.exports = {
    COLORS, asset, divider, footerQuip, errorEmbed,
    reminderSetEmbed, reminderFiredEmbed,
    cooldownSetEmbed, cooldownExpiredEmbed, cooldownRemovedEmbed,
    balanceEmbed, addMoneyEmbed, removeMoneyEmbed,
    memoryListEmbed, ticketWelcomeEmbed, categoryListEmbed,
};
