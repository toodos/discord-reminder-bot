/**
 * utils/timer.js
 * Parses human-readable time strings into milliseconds.
 * Supports: 30s, 10m, 2h, 1d, and combined units like 1h30m
 */
function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;

    // Combined units e.g. "1h30m", "2d12h"
    const combinedRegex = /(\d+)([smhd])/g;
    const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

    let total = 0;
    let matched = false;

    for (const [, value, unit] of timeStr.matchAll(combinedRegex)) {
        total += parseInt(value) * units[unit];
        matched = true;
    }

    return matched ? total : null;
}

/**
 * Formats milliseconds into a human-readable string.
 * e.g. 3661000 → "1h 1m 1s"
 */
function formatDuration(ms) {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60_000) % 60;
    const h = Math.floor(ms / 3_600_000) % 24;
    const d = Math.floor(ms / 86_400_000);

    return [
        d && `${d}d`,
        h && `${h}h`,
        m && `${m}m`,
        (!d && !h && s) && `${s}s`,
    ].filter(Boolean).join(' ') || '0s';
}

module.exports = { parseTime, formatDuration };
