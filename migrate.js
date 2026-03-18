/**
 * migrate.js
 * One-time script to migrate data from the old database.json to the new SQLite DB.
 * Run ONCE with: node migrate.js
 * You can delete this file after running it.
 */

require('dotenv').config();
const fs       = require('fs');
const path     = require('path');
const Database = require('better-sqlite3');

const JSON_PATH = path.join(__dirname, 'data/database.json');
const DB_PATH   = path.join(__dirname, 'data/blossom.db');

// ── Safety checks ─────────────────────────────────────────────────────────────

if (!fs.existsSync(JSON_PATH)) {
    console.error('❌ Could not find data/database.json — make sure it exists in the data/ folder.');
    process.exit(1);
}

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// ── Load JSON ─────────────────────────────────────────────────────────────────

const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const users     = json.users     || {};
const cooldowns = json.cooldowns || [];
const reminders = json.reminders || [];
const memory    = json.memory    || {};

// ── Open SQLite ───────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId  TEXT PRIMARY KEY,
        balance REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cooldowns (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        userId      TEXT NOT NULL UNIQUE,
        channelId   TEXT NOT NULL,
        endTime     INTEGER NOT NULL,
        initiatorId TEXT
    );
    CREATE TABLE IF NOT EXISTS reminders (
        id          TEXT PRIMARY KEY,
        userId      TEXT NOT NULL,
        channelId   TEXT NOT NULL,
        message     TEXT NOT NULL,
        endTime     INTEGER NOT NULL,
        initiatorId TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guilds (
        guildId             TEXT PRIMARY KEY,
        adminRoleId         TEXT,
        logChannelId        TEXT,
        transcriptChannelId TEXT,
        ticketCount         INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
        id          TEXT PRIMARY KEY,
        guildId     TEXT NOT NULL,
        name        TEXT NOT NULL,
        emoji       TEXT NOT NULL,
        roles       TEXT NOT NULL DEFAULT '[]',
        categoryId  TEXT NOT NULL,
        maxTickets  INTEGER NOT NULL DEFAULT 1,
        questions   TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS tickets (
        channelId   TEXT PRIMARY KEY,
        guildId     TEXT NOT NULL,
        userId      TEXT NOT NULL,
        categoryId  TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'open',
        claimantId  TEXT,
        createdAt   INTEGER NOT NULL,
        closedAt    INTEGER,
        answers     TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS blacklist (
        guildId TEXT NOT NULL,
        userId  TEXT NOT NULL,
        PRIMARY KEY (guildId, userId)
    );
    CREATE TABLE IF NOT EXISTS memory (
        slot    INTEGER PRIMARY KEY,
        message TEXT NOT NULL
    );
`);

// ── Migrate ───────────────────────────────────────────────────────────────────

const insertUser     = db.prepare('INSERT OR IGNORE INTO users (userId, balance) VALUES (?, ?)');
const insertCooldown = db.prepare('INSERT OR IGNORE INTO cooldowns (userId, channelId, endTime, initiatorId) VALUES (?, ?, ?, ?)');
const insertReminder = db.prepare('INSERT OR IGNORE INTO reminders (id, userId, channelId, message, endTime, initiatorId) VALUES (?, ?, ?, ?, ?, ?)');
const insertMemory   = db.prepare('INSERT OR REPLACE INTO memory (slot, message) VALUES (?, ?)');

let userCount = 0, cooldownCount = 0, reminderCount = 0, memoryCount = 0;

// Users
const migrateAll = db.transaction(() => {
    for (const [userId, data] of Object.entries(users)) {
        insertUser.run(userId, data.balance ?? 0);
        userCount++;
    }

    for (const cd of cooldowns) {
        insertCooldown.run(cd.userId, cd.channelId, cd.endTime, cd.initiatorId ?? null);
        cooldownCount++;
    }

    for (const r of reminders) {
        insertReminder.run(r.id, r.userId, r.channelId, r.message, r.endTime, r.initiatorId);
        reminderCount++;
    }

    for (const [slot, message] of Object.entries(memory)) {
        if (message) {
            insertMemory.run(parseInt(slot), message);
            memoryCount++;
        }
    }
});

migrateAll();

// ── Report ────────────────────────────────────────────────────────────────────

console.log('\n✅ Migration complete!\n');
console.log(`   👤 Users migrated:     ${userCount}`);
console.log(`   🌙 Cooldowns migrated: ${cooldownCount}`);
console.log(`   ⏰ Reminders migrated: ${reminderCount}`);
console.log(`   📋 Memory migrated:    ${memoryCount}`);
console.log(`\n   Database saved to: ${DB_PATH}`);
console.log('\n⚠️  Your old database.json has NOT been deleted.');
console.log('   Once you verify the bot works, you can safely delete it.\n');

db.close();
