/**
 * utils/embeds.js
 * Centralized embed factories. Change colors/style here, affects the whole bot.
 */
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

const COLORS = {
    pink:       '#ff85a2',
    lavender:   '#c3aed6',
    gold:       '#ffc8dd',
    purple:     '#ffb7ff',
    discord:    '#5865F2',
};

function asset(name) {
    return new AttachmentBuilder(path.join(__dirname, `../assets/${name}`));
}

function divider() {
    return '─── ⋅ ʚ ♡ ɞ ⋅ ───';
}

function wrap(text) {
    return `${divider()}\n\n${text}\n\n${divider()}`;
}

/**
 * Base embed with shared defaults
 */
function base(color = COLORS.pink) {
    return new EmbedBuilder().setColor(color).setTimestamp();
}

// ─── Reminder Embeds ──────────────────────────────────────────────────────────

function reminderSetEmbed(targetUser, message, timeStr, targetChannel) {
    return {
        file: asset('reminder.png'),
        embed: base(COLORS.pink)
            .setTitle('⏰ Reminder Set! ✨')
            .setThumbnail('attachment://reminder.png')
            .setDescription(wrap(`I'll remind ${targetUser} about:\n> ${message} 🎀`))
            .addFields(
                { name: '✨ In', value: `\`${timeStr}\``, inline: true },
                { name: '🌷 Channel', value: `${targetChannel}`, inline: true }
            ),
    };
}

function reminderFiredEmbed(message, initiatorTag) {
    return {
        file: asset('reminder.png'),
        embed: base(COLORS.pink)
            .setTitle('🔔 Ding-dong! Reminder! 🎀')
            .setThumbnail('attachment://reminder.png')
            .setDescription(wrap(`${message} ✨`))
            .setFooter({ text: `Lovingly set by ${initiatorTag} 🌸` }),
    };
}

// ─── Cooldown Embeds ──────────────────────────────────────────────────────────

function cooldownSetEmbed(targetUser, timeStr, endTime, initiator) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.pink)
            .setTitle('🌸 Chill Time! ✨')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(wrap(`${targetUser} is taking a li'l nap. They can receive their next task after the cooldown ends!`))
            .addFields(
                { name: '✨ Resting', value: `${targetUser}`, inline: true },
                { name: '⏳ Duration', value: `\`${timeStr}\``, inline: true },
                { name: '🌙 Wakes At', value: `<t:${Math.floor(endTime / 1000)}:f> (<t:${Math.floor(endTime / 1000)}:R>)`, inline: false },
                { name: '🍭 Started By', value: `${initiator}`, inline: true }
            )
            .setFooter({ text: 'Status: Counting down the sleepy time...' }),
    };
}

function cooldownExpiredEmbed(mention) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.pink)
            .setTitle('🎀 Cooldown Expired! 🌷')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(wrap(`Paging ${mention}!\nYou can be assigned the task now! 🎀🌷`)),
    };
}

function cooldownRemovedEmbed(targetUser) {
    return {
        file: asset('cooldown.png'),
        embed: base(COLORS.pink)
            .setTitle('☀️ Nap Time Over! ✨')
            .setThumbnail('attachment://cooldown.png')
            .setDescription(wrap(`Successfully cleared cooldowns for ${targetUser}!\nThey're wide awake and ready for tasks! ✨🌸`)),
    };
}

// ─── Economy Embeds ───────────────────────────────────────────────────────────

function balanceEmbed(client, targetUser, balance, rank, leaderboardStr) {
    return {
        file: asset('balance.png'),
        embed: base(COLORS.purple)
            .setAuthor({ name: `${targetUser.username}'s Sparkly Vault 💎`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail('attachment://balance.png')
            .setDescription(wrap('Checking the vault floors... 🩰✨'))
            .addFields(
                { name: '💰 Current Wealth', value: `\`₹${balance.toLocaleString()}\` 🌸`, inline: true },
                { name: '📊 Global Rank', value: `\`#${rank}\` ✨`, inline: true },
                { name: '\u200B', value: '\u200B', inline: false },
                { name: '🏆 Top Ballers (Global) 🍭', value: leaderboardStr || '*No records found yet!*', inline: false }
            )
            .setFooter({ text: 'Economy System v2.0 🎀', iconURL: client.user.displayAvatarURL() }),
    };
}

function addMoneyEmbed(targetUser, amount, newBalance) {
    return {
        file: asset('money.png'),
        embed: base(COLORS.gold)
            .setTitle('💰 Yay! Money Added! ✨')
            .setThumbnail('attachment://money.png')
            .setDescription(wrap(`Added **₹${amount}** to ${targetUser}'s sparkly vault! 🍬`))
            .addFields({ name: '✨ New Balance', value: `**₹${newBalance.toLocaleString()}**` }),
    };
}

function removeMoneyEmbed(targetUser, amount, newBalance) {
    return {
        file: asset('money.png'),
        embed: base(COLORS.lavender)
            .setTitle('💸 Balance Deducted 🌷')
            .setThumbnail('attachment://money.png')
            .setDescription(wrap(`Removed **₹${amount}** from ${targetUser}'s account. 🍬`))
            .addFields({ name: '✨ Remaining Balance', value: `**₹${newBalance.toLocaleString()}**` }),
    };
}

// ─── Memory Embeds ────────────────────────────────────────────────────────────

function memoryListEmbed(slots) {
    const lines = [1, 2, 3, 4].map(slot => {
        const msg = slots[slot];
        const preview = msg ? (msg.length > 50 ? msg.slice(0, 47) + '...' : msg) : '*Empty*';
        return `**Slot ${slot}:** ${preview}`;
    }).join('\n');

    return base(COLORS.gold)
        .setTitle('📋 Bot Memory Slots 🌸')
        .setDescription(wrap(lines));
}

// ─── Ticket Embeds ────────────────────────────────────────────────────────────

function ticketWelcomeEmbed(user, count, category, answers) {
    const embed = base(COLORS.discord)
        .setTitle(`🎫 Ticket #${count}`)
        .setDescription(`Welcome ${user}! Staff will be with you shortly.\n\n**Category:** ${category.emoji} ${category.name}`)
        .setTimestamp();

    const keys = Object.keys(answers);
    if (keys.length > 0) {
        embed.addFields(keys.map(k => ({ name: k, value: answers[k], inline: false })));
    }

    return embed;
}

module.exports = {
    COLORS, asset, wrap,
    reminderSetEmbed, reminderFiredEmbed,
    cooldownSetEmbed, cooldownExpiredEmbed, cooldownRemovedEmbed,
    balanceEmbed, addMoneyEmbed, removeMoneyEmbed,
    memoryListEmbed, ticketWelcomeEmbed,
};
