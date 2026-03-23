/**
 * utils/embeds.js
 * Centralized embed factories. Change colors/style here, affects the whole bot.
 */
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

const COLORS = {
    success:    '#57f287',
    danger:     '#ed4245',
    warning:    '#fee75c',
    info:       '#5865f2',
    pink:       '#ff85a2',
    gold:       '#ffd700',
};

function asset(name) {
    return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

function divider() {
    return '─── ⋅ ʚ ♡ ɞ ⋅ ───';
}

function wrap(text) {
    return text;
}

/**
 * Base embed with shared defaults
 */
function base(color = COLORS.pink) {
    return new EmbedBuilder().setColor(color).setTimestamp();
}

/**
 * Standard error embed
 */
function errorEmbed(content) {
    return base(COLORS.danger)
        .setTitle('❌ Error')
        .setDescription(content);
}

function getTier(balance) {
    if (balance >= 100000) return '💎';
    if (balance >= 50000)  return '👑';
    if (balance >= 10000)  return '💳';
    if (balance >= 1000)   return '💵';
    return '🪨';
}

// ─── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
    return {
        file: asset('reminder.png'),
        embed: base(COLORS.info)
            .setTitle('⏰ Reminder Set!')
            .setThumbnail('attachment://reminder.png')
            .setDescription(`Checking in with ${targetUser} later...`)
            .addFields(
                { name: '📝 Message', value: `\`\`\`${message}\`\`\`` },
                { name: '⏳ In', value: `\`${timeStr}\``, inline: true },
                { name: '📍 Channel', value: `${targetChannel}`, inline: true }
            ),
    };
}

function reminderFiredEmbed(message, initiatorTag) {
    return {
        file: asset('reminder.png'),
        embed: base(COLORS.warning)
            .setTitle('🔔 Ding-dong! Reminder!')
            .setThumbnail('attachment://reminder.png')
            .setDescription(`### ${message}`)
            .setFooter({ text: `Set by ${initiatorTag}`, iconURL: 'attachment://reminder.png' }),
    };
}

// ─── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
    const unix = Math.floor(endTime / 1000);
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.info)
            .setTitle('💤 Sleepy Time...')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(`${targetUser} is taking a well-deserved nap.`)
            .addFields(
                { name: '🌙 Duration', value: `\`${timeStr}\``, inline: true },
                { name: '⏰ Wakes At', value: `<t:${unix}:F>`, inline: true },
                { name: '⏳ Remaining', value: `<t:${unix}:R>`, inline: true },
                { name: '👤 Set By', value: `${initiator}`, inline: true }
            )
            .setFooter({ text: 'Status: Fast asleep...' }),
    };
}

function cooldownExpiredEmbed(mention) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.success)
            .setTitle('✨ Rise and Shine!')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(`Wake up ${mention}! You're ready for more tasks. 🌸`),
    };
}

function cooldownRemovedEmbed(targetUser) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.success)
            .setTitle('☀️ Early Awakening')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(`Successfully cleared cooldowns for ${targetUser}. They're wide awake!`),
    };
}

// ─── Economy Embeds ───────────────────────────────────────────────────────────

function balanceEmbed(client, targetUser, balance, rank, leaderboardStr, totalEconomy) {
    return {
        file: asset('balance.png'),
        embed: base(COLORS.gold)
            .setAuthor({ name: `${targetUser.username}'s Vault`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail('attachment://balance.png')
            .setDescription(`### 📊 Global Standing\n${leaderboardStr || '*No records found yet!*'}`)
            .addFields(
                { name: '💰 Current Wealth', value: `\`₹${balance.toLocaleString()}\``, inline: true },
                { name: '📈 Rank', value: `\`#${rank}\``, inline: true }
            )
            .setFooter({ text: `Total Economy: ₹${totalEconomy.toLocaleString()} in circulation`, iconURL: client.user.displayAvatarURL() }),
    };
}

function addMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
    const tier = getTier(newBalance);
    const oldTier = getTier(oldBalance);
    const tierDisplay = oldTier === tier ? tier : `${oldTier} → ${tier}`;

    return {
        file: asset('money.png'),
        embed: base(COLORS.success)
            .setTitle('💰 Transaction: Deposit')
            .setThumbnail('attachment://money.png')
            .setDescription(`Successfully added **₹${amount.toLocaleString()}** to ${targetUser}'s vault.`)
            .addFields(
                { name: '💰 Balance Update', value: `\`₹${oldBalance.toLocaleString()}\` → **₹${newBalance.toLocaleString()}**`, inline: true },
                { name: '📈 Wealth Tier', value: `\`${tierDisplay}\``, inline: true }
            ),
    };
}

function removeMoneyEmbed(targetUser, amount, oldBalance, newBalance) {
    const tier = getTier(newBalance);
    const oldTier = getTier(oldBalance);
    const tierDisplay = oldTier === tier ? tier : `${oldTier} → ${tier}`;

    return {
        file: asset('money.png'),
        embed: base(COLORS.danger)
            .setTitle('💸 Transaction: Withdrawal')
            .setThumbnail('attachment://money.png')
            .setDescription(`Successfully removed **₹${amount.toLocaleString()}** from ${targetUser}'s vault.`)
            .addFields(
                { name: '📈 Balance Update', value: `\`₹${oldBalance.toLocaleString()}\` → **₹${newBalance.toLocaleString()}**`, inline: true },
                { name: '📉 Wealth Tier', value: `\`${tierDisplay}\``, inline: true }
            ),
    };
}

// ─── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
    const lines = [1, 2, 3, 4].map(slot => {
        const msg = slots[slot];
        const preview = msg ? (msg.length > 50 ? msg.slice(0, 47) + '...' : msg) : '*Empty*';
        const charCount = msg ? msg.length : 0;
        return `**Slot ${slot}:** ${preview} \`(${charCount} chars)\``;
    }).join('\n');

    return base(COLORS.gold)
        .setTitle('📋 Bot Memory Slots')
        .setDescription(lines);
}

// ─── Ticket Embeds ────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
    const embed = base(COLORS.info)
        .setTitle(`🎫 Ticket #${count}`)
        .setDescription(`Hello ${user}, thank you for reaching out! Support will be with you shortly.`)
        .addFields(
            { name: '📂 Category', value: `${category.emoji} ${category.name}`, inline: true },
            { name: '👤 Opener', value: `${user}`, inline: true }
        );

    const keys = Object.keys(answers);
    if (keys.length > 0) {
        embed.addFields({ name: '\u200B', value: '### 📝 Form Responses' });
        embed.addFields(keys.map(k => ({ name: k, value: answers[k], inline: false })));
    }

    return embed;
}

function categoryListEmbed(categories) {
    const tableHeader = 'Emoji | Name       | ID\n------|------------|---------';
    const rows = categories.map(c => {
        const name = c.name.padEnd(10).slice(0, 10);
        return `${c.emoji.padEnd(5)} | ${name} | ${c.id}`;
    }).join('\n');

    return base(COLORS.gold)
        .setTitle('📋 Ticket Categories')
        .setDescription(`\`\`\`\n${tableHeader}\n${rows}\n\`\`\``);
}

module.exports = {
    COLORS, asset, wrap, errorEmbed,
    reminderSetEmbed, reminderFiredEmbed,
    cooldownSetEmbed, cooldownExpiredEmbed, cooldownRemovedEmbed,
    balanceEmbed, addMoneyEmbed, removeMoneyEmbed,
    memoryListEmbed, ticketWelcomeEmbed, categoryListEmbed,
};
