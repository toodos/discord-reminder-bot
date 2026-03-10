/**
 * Parses a time string (e.g., "10m", "1h") into milliseconds.
 * @param {string} timeStr - The time string to parse.
 * @returns {number|null} - The duration in milliseconds, or null if invalid.
 */
function parseTime(timeStr) {
    const timeRegex = /^(\d+)([smhd])$/;
    const matches = timeStr.match(timeRegex);

    if (!matches) return null;

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = { parseTime };
