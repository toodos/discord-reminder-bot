/**
 * utils/database.js
 * Unified SQLite database. No more JSON file reads/writes on every operation.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'blossom.db'));

// Enable WAL mode for better concurrent performance and crash safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userId      TEXT PRIMARY KEY,
        balance     REAL NOT NULL DEFAULT 0
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

// ─── Economy ──────────────────────────────────────────────────────────────────

const stmts = {
    getUser:        db.prepare('SELECT * FROM users WHERE userId = ?'),
    upsertUser:     db.prepare('INSERT INTO users (userId, balance) VALUES (?, 0) ON CONFLICT(userId) DO NOTHING'),
    addMoney:       db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?'),
    removeMoney:    db.prepare('UPDATE users SET balance = balance - ? WHERE userId = ?'),
    getAllUsers:     db.prepare('SELECT * FROM users ORDER BY balance DESC'),

    // Cooldowns
    getCooldown:    db.prepare('SELECT * FROM cooldowns WHERE userId = ?'),
    getAllCooldowns: db.prepare('SELECT * FROM cooldowns'),
    setCooldown:    db.prepare('INSERT INTO cooldowns (userId, channelId, endTime, initiatorId) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET channelId=excluded.channelId, endTime=excluded.endTime, initiatorId=excluded.initiatorId'),
    clearCooldown:  db.prepare('DELETE FROM cooldowns WHERE userId = ? AND endTime = ?'),
    removeCooldownByUserId: db.prepare('DELETE FROM cooldowns WHERE userId = ?'),

    // Reminders
    addReminder:    db.prepare('INSERT INTO reminders (id, userId, channelId, message, endTime, initiatorId) VALUES (?, ?, ?, ?, ?, ?)'),
    getAllReminders: db.prepare('SELECT * FROM reminders'),
    getReminderById: db.prepare('SELECT * FROM reminders WHERE id = ?'),
    removeReminder: db.prepare('DELETE FROM reminders WHERE id = ?'),
    removeRemindersByUserId: db.prepare('DELETE FROM reminders WHERE userId = ?'),

    // Memory
    setMemory:      db.prepare('INSERT INTO memory (slot, message) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET message=excluded.message'),
    getMemory:      db.prepare('SELECT message FROM memory WHERE slot = ?'),
    getAllMemory:    db.prepare('SELECT * FROM memory'),
};

function ensureUser(userId) {
    stmts.upsertUser.run(userId);
}

function getUser(userId) {
    ensureUser(userId);
    return stmts.getUser.get(userId);
}

function addMoney(userId, amount) {
    ensureUser(userId);
    stmts.addMoney.run(amount, userId);
    return stmts.getUser.get(userId).balance;
}

function removeMoney(userId, amount) {
    ensureUser(userId);
    stmts.removeMoney.run(amount, userId);
    return stmts.getUser.get(userId).balance;
}

function getAllUsers() {
    return stmts.getAllUsers.all();
}

// ─── Cooldowns ────────────────────────────────────────────────────────────────

function getCooldown(userId) {
    return stmts.getCooldown.get(userId) || null;
}

function getCooldowns() {
    return stmts.getAllCooldowns.all();
}

function setCooldown(userId, channelId, endTime, initiatorId) {
    stmts.setCooldown.run(userId, channelId, endTime, initiatorId);
}

function clearCooldown(userId, endTime) {
    stmts.clearCooldown.run(userId, endTime);
}

function removeCooldownByUserId(userId) {
    stmts.removeCooldownByUserId.run(userId);
}

// ─── Reminders ────────────────────────────────────────────────────────────────

function addReminder(userId, channelId, message, endTime, initiatorId) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    stmts.addReminder.run(id, userId, channelId, message, endTime, initiatorId);
    return id;
}

function getReminders() {
    return stmts.getAllReminders.all();
}

function reminderExists(id) {
    return !!stmts.getReminderById.get(id);
}

function removeReminder(id) {
    stmts.removeReminder.run(id);
}

function removeRemindersByUserId(userId) {
    stmts.removeRemindersByUserId.run(userId);
}

// ─── Guild / Tickets ──────────────────────────────────────────────────────────

function getGuildConfig(guildId) {
    return db.prepare('SELECT * FROM guilds WHERE guildId = ?').get(guildId) || {};
}

function setGuildConfig(guildId, data) {
    const existing = db.prepare('SELECT guildId FROM guilds WHERE guildId = ?').get(guildId);
    if (existing) {
        const keys = Object.keys(data);
        const clause = keys.map(k => `${k} = ?`).join(', ');
        db.prepare(`UPDATE guilds SET ${clause} WHERE guildId = ?`).run(...Object.values(data), guildId);
    } else {
        db.prepare('INSERT INTO guilds (guildId, adminRoleId, logChannelId, transcriptChannelId) VALUES (?, ?, ?, ?)')
            .run(guildId, data.adminRoleId, data.logChannelId, data.transcriptChannelId);
    }
}

function incrementTicketCount(guildId) {
    db.prepare('INSERT INTO guilds (guildId) VALUES (?) ON CONFLICT(guildId) DO NOTHING').run(guildId);
    db.prepare('UPDATE guilds SET ticketCount = ticketCount + 1 WHERE guildId = ?').run(guildId);
    return db.prepare('SELECT ticketCount FROM guilds WHERE guildId = ?').get(guildId).ticketCount;
}

function getCategories(guildId) {
    return db.prepare('SELECT * FROM categories WHERE guildId = ?').all(guildId);
}

function getCategory(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function createCategory(data) {
    db.prepare('INSERT INTO categories (id, guildId, name, emoji, roles, categoryId, maxTickets, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(data.id, data.guildId, data.name, data.emoji, JSON.stringify(data.roles), data.categoryId, data.maxTickets, JSON.stringify(data.questions));
}

function deleteCategory(id) {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

function createTicket(data) {
    db.prepare('INSERT INTO tickets (channelId, guildId, userId, categoryId, createdAt, answers) VALUES (?, ?, ?, ?, ?, ?)')
        .run(data.channelId, data.guildId, data.userId, data.categoryId, data.createdAt, JSON.stringify(data.answers));
}

function getTicket(channelId) {
    return db.prepare('SELECT * FROM tickets WHERE channelId = ?').get(channelId);
}

function updateTicket(channelId, data) {
    const keys = Object.keys(data);
    const clause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE tickets SET ${clause} WHERE channelId = ?`).run(...Object.values(data), channelId);
}

function getUserActiveTickets(userId, guildId) {
    return db.prepare("SELECT * FROM tickets WHERE userId = ? AND guildId = ? AND status = 'open'").all(userId, guildId);
}

function isBlacklisted(guildId, userId) {
    return !!db.prepare('SELECT 1 FROM blacklist WHERE guildId = ? AND userId = ?').get(guildId, userId);
}

// ─── Memory ───────────────────────────────────────────────────────────────────

function setMemory(slot, message) {
    stmts.setMemory.run(slot, message);
}

function getMemory(slot) {
    const row = stmts.getMemory.get(slot);
    return row ? row.message : null;
}

function getAllMemory() {
    const rows = stmts.getAllMemory.all();
    return Object.fromEntries(rows.map(r => [r.slot, r.message]));
}

module.exports = {
    // Economy
    getUser, addMoney, removeMoney, getAllUsers,
    // Cooldowns
    getCooldown, getCooldowns, setCooldown, clearCooldown, removeCooldownByUserId,
    // Reminders
    addReminder, getReminders, reminderExists, removeReminder, removeRemindersByUserId,
    // Guild/Tickets
    getGuildConfig, setGuildConfig, incrementTicketCount,
    getCategories, getCategory, createCategory, deleteCategory,
    createTicket, getTicket, updateTicket, getUserActiveTickets,
    isBlacklisted,
    // Memory
    setMemory, getMemory, getAllMemory,
};
