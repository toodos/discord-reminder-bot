/**
 * utils/timerManager.js
 * Centralized timer scheduling. Loaded once on startup.
 * Handles recovery of timers after restarts.
 */
const db = require('./database');
const embeds = require('./embeds');

let _client = null;

// ─── Cooldowns ────────────────────────────────────────────────────────────────

async function processExpiredCooldown(cd) {
    // Guard: confirm it still exists in DB before processing
    if (!db.getCooldown(cd.userId)) return;

    try {
        const user    = await _client.users.fetch(cd.userId).catch(() => null);
        const channel = await _client.channels.fetch(cd.channelId).catch(() => null);

        // Always clean up regardless of fetch success
        db.clearCooldown(cd.userId, cd.endTime);

        if (!user || !channel) return;

        let initiator = null;
        if (cd.initiatorId) {
            initiator = await _client.users.fetch(cd.initiatorId).catch(() => null);
        }

        const mention = initiator ? `${user} and ${initiator}` : `${user}`;
        const { file, embed } = embeds.cooldownExpiredEmbed(mention);

        // DM the target user
        try {
            const { file: dmFile, embed: dmEmbed } = embeds.cooldownExpiredEmbed('you');
            dmEmbed.setTitle('🌸 Cooldown Expired! ✨')
                   .setDescription(embeds.wrap('Yay! You can be assigned the task now! ✨🌸'));
            await user.send({ embeds: [dmEmbed], files: [dmFile] });
        } catch { /* DMs may be closed */ }

        // Ping in channel
        await channel.send({ content: `${mention}`, embeds: [embed], files: [file] });
    } catch (err) {
        console.error(`[Cooldown] Error processing for ${cd.userId}:`, err.message);
        db.clearCooldown(cd.userId, cd.endTime);
    }
}

async function processExpiredReminder(reminder) {
    // Guard: confirm still exists
    if (!db.reminderExists(reminder.id)) return;

    try {
        const targetUser    = await _client.users.fetch(reminder.userId).catch(() => null);
        const targetChannel = await _client.channels.fetch(reminder.channelId).catch(() => null);
        const initiator     = await _client.users.fetch(reminder.initiatorId).catch(() => null);

        db.removeReminder(reminder.id);

        if (!targetUser || !targetChannel) return;

        const initiatorTag = initiator ? initiator.tag : 'someone';
        const { file, embed } = embeds.reminderFiredEmbed(reminder.message, initiatorTag);

        // DM
        try { await targetUser.send({ embeds: [embed], files: [file] }); } catch { /* DMs may be closed */ }

        // Channel ping
        await targetChannel.send({ content: `${targetUser}`, embeds: [embed], files: [file] });
    } catch (err) {
        console.error(`[Reminder] Error processing ${reminder.id}:`, err.message);
        db.removeReminder(reminder.id);
    }
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

function scheduleCooldown(cd) {
    const remaining = cd.endTime - Date.now();
    if (remaining <= 0) {
        processExpiredCooldown(cd);
    } else {
        setTimeout(() => processExpiredCooldown(cd), remaining);
    }
}

function scheduleReminder(reminder) {
    const remaining = reminder.endTime - Date.now();
    if (remaining <= 0) {
        processExpiredReminder(reminder);
    } else {
        setTimeout(() => processExpiredReminder(reminder), remaining);
    }
}

/**
 * Called once on bot ready. Recovers all persisted timers.
 */
function init(client) {
    _client = client;

    const now = Date.now();

    for (const cd of db.getCooldowns()) {
        scheduleCooldown(cd);
    }

    for (const reminder of db.getReminders()) {
        scheduleReminder(reminder);
    }

    console.log('[TimerManager] Restored all cooldowns and reminders.');
}

module.exports = { init, scheduleCooldown, scheduleReminder, processExpiredCooldown, processExpiredReminder };
