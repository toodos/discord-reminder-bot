/**
 * Ticket System Database Module
 * Migrated to utils/ticket-db.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path relative to root of the bot
const dbPath = path.join(__dirname, '../tickets.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
        guildId TEXT PRIMARY KEY,
        adminRoleId TEXT,
        logChannelId TEXT,
        transcriptChannelId TEXT,
        ticketCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        guildId TEXT,
        name TEXT,
        emoji TEXT,
        roles TEXT, -- JSON array of role IDs
        categoryId TEXT, -- Discord Category ID
        maxTickets INTEGER DEFAULT 1,
        questions TEXT -- JSON array of modal questions
    );

    CREATE TABLE IF NOT EXISTS tickets (
        channelId TEXT PRIMARY KEY,
        guildId TEXT,
        userId TEXT,
        categoryId TEXT,
        status TEXT DEFAULT 'open',
        claimantId TEXT,
        createdAt INTEGER,
        closedAt INTEGER,
        rating INTEGER,
        answers TEXT -- JSON string of modal answers
    );

    CREATE TABLE IF NOT EXISTS panels (
        id TEXT PRIMARY KEY,
        guildId TEXT,
        channelId TEXT,
        messageId TEXT,
        title TEXT,
        description TEXT,
        color TEXT,
        categories TEXT -- JSON array of category IDs
    );

    CREATE TABLE IF NOT EXISTS tags (
        guildId TEXT,
        name TEXT,
        content TEXT,
        PRIMARY KEY (guildId, name)
    );

    CREATE TABLE IF NOT EXISTS blacklist (
        guildId TEXT,
        userId TEXT,
        PRIMARY KEY (guildId, userId)
    );

    CREATE TABLE IF NOT EXISTS staff_stats (
        guildId TEXT,
        staffId TEXT,
        ticketsHandled INTEGER DEFAULT 0,
        totalResponseTime INTEGER DEFAULT 0,
        totalRatings INTEGER DEFAULT 0,
        ratingCount INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, staffId)
    );
`);

module.exports = {
    getGuildConfig: (guildId) => db.prepare('SELECT * FROM guilds WHERE guildId = ?').get(guildId) || {},
    setGuildConfig: (guildId, data) => {
        const current = db.prepare('SELECT * FROM guilds WHERE guildId = ?').get(guildId);
        if (current) {
            const keys = Object.keys(data);
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            db.prepare(`UPDATE guilds SET ${setClause} WHERE guildId = ?`).run(...Object.values(data), guildId);
        } else {
            db.prepare('INSERT INTO guilds (guildId, adminRoleId, logChannelId, transcriptChannelId) VALUES (?, ?, ?, ?)').run(guildId, data.adminRoleId, data.logChannelId, data.transcriptChannelId);
        }
    },
    incrementTicketCount: (guildId) => {
        db.prepare('INSERT OR IGNORE INTO guilds (guildId) VALUES (?)').run(guildId);
        db.prepare('UPDATE guilds SET ticketCount = ticketCount + 1 WHERE guildId = ?').run(guildId);
        return db.prepare('SELECT ticketCount FROM guilds WHERE guildId = ?').get(guildId).ticketCount;
    },
    getCategories: (guildId) => db.prepare('SELECT * FROM categories WHERE guildId = ?').all(guildId),
    getCategory: (id) => db.prepare('SELECT * FROM categories WHERE id = ?').get(id),
    createCategory: (data) => db.prepare('INSERT INTO categories (id, guildId, name, emoji, roles, categoryId, maxTickets, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(data.id, data.guildId, data.name, data.emoji, JSON.stringify(data.roles), data.categoryId, data.maxTickets, JSON.stringify(data.questions)),
    createTicket: (data) => db.prepare('INSERT INTO tickets (channelId, guildId, userId, categoryId, createdAt, answers) VALUES (?, ?, ?, ?, ?, ?)').run(data.channelId, data.guildId, data.userId, data.categoryId, data.createdAt, JSON.stringify(data.answers)),
    getTicket: (channelId) => db.prepare('SELECT * FROM tickets WHERE channelId = ?').get(channelId),
    updateTicket: (channelId, data) => {
        const keys = Object.keys(data);
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        db.prepare(`UPDATE tickets SET ${setClause} WHERE channelId = ?`).run(...Object.values(data), channelId);
    },
    getUserActiveTickets: (userId, guildId) => db.prepare('SELECT * FROM tickets WHERE userId = ? AND guildId = ? AND status = "open"').all(userId, guildId),
    isBlacklisted: (guildId, userId) => !!db.prepare('SELECT 1 FROM blacklist WHERE guildId = ? AND userId = ?').get(guildId, userId),
    addToBlacklist: (guildId, userId) => db.prepare('INSERT OR IGNORE INTO blacklist (guildId, userId) VALUES (?, ?)').run(guildId, userId),
    removeFromBlacklist: (guildId, userId) => db.prepare('DELETE FROM blacklist WHERE guildId = ? AND userId = ?').run(guildId, userId),
    getTag: (guildId, name) => db.prepare('SELECT * FROM tags WHERE guildId = ? AND name = ?').get(guildId, name),
    getTags: (guildId) => db.prepare('SELECT * FROM tags WHERE guildId = ?').all(guildId),
    createTag: (guildId, name, content) => db.prepare('INSERT OR REPLACE INTO tags (guildId, name, content) VALUES (?, ?, ?)').run(guildId, name, content),
    deleteTag: (guildId, name) => db.prepare('DELETE FROM tags WHERE guildId = ? AND name = ?').run(guildId, name),
    updateStaffStats: (guildId, staffId, rating) => {
        db.prepare('INSERT OR IGNORE INTO staff_stats (guildId, staffId) VALUES (?, ?)').run(guildId, staffId);
        if (rating) {
            db.prepare('UPDATE staff_stats SET ticketsHandled = ticketsHandled + 1, totalRatings = totalRatings + ?, ratingCount = ratingCount + 1 WHERE guildId = ? AND staffId = ?').run(rating, guildId, staffId);
        } else {
            db.prepare('UPDATE staff_stats SET ticketsHandled = ticketsHandled + 1 WHERE guildId = ? AND staffId = ?').run(guildId, staffId);
        }
    }
};
