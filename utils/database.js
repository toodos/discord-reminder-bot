/**
 * utils/database.js
 * ⚡ Pure JavaScript high-performance JSON database engine.
 * Zero native C++ dependencies (no node-gyp, no compilation errors on Docker / Bot-Hosting).
 * In-memory sub-millisecond access with atomic asynchronous/synchronous file persistence.
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'database.json');
const TMP_PATH = path.join(dataDir, 'database.json.tmp');

// Default database structure
const defaultSchema = {
    users: {},
    transactions: [],
    cooldowns: {},
    reminders: {},
    guilds: {},
    categories: {},
    tickets: {},
    blacklist: {},
    memory: {},
    brain_memories: [],
    upi: {},
};

// In-memory data store
let db = { ...defaultSchema };

function loadDatabase() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            db = {
                users: parsed.users || {},
                transactions: parsed.transactions || [],
                cooldowns: parsed.cooldowns || {},
                reminders: parsed.reminders || {},
                guilds: parsed.guilds || {},
                categories: parsed.categories || {},
                tickets: parsed.tickets || {},
                blacklist: parsed.blacklist || {},
                memory: parsed.memory || {},
                brain_memories: parsed.brain_memories || [],
                upi: parsed.upi || {},
            };
        } else {
            saveSync();
        }
    } catch (err) {
        console.error('[Database] Failed to parse database.json, initializing defaults:', err.message);
        db = { ...defaultSchema };
    }
}

// Atomic file save to prevent corruption
let saveTimeout = null;
function saveSync() {
    try {
        const json = JSON.stringify(db, null, 2);
        fs.writeFileSync(TMP_PATH, json, 'utf8');
        fs.renameSync(TMP_PATH, DB_PATH);
    } catch (err) {
        console.error('[Database] Sync save error:', err.message);
    }
}

function scheduleSave() {
    if (saveTimeout) return;
    saveTimeout = setTimeout(() => {
        saveTimeout = null;
        saveSync();
    }, 100);
}

// Ensure database is saved before process exits
process.on('exit', () => saveSync());
process.on('SIGINT', () => { saveSync(); process.exit(0); });
process.on('SIGTERM', () => { saveSync(); process.exit(0); });

// Initialize database
loadDatabase();

// ─── Economy ──────────────────────────────────────────────────────────────────

function ensureUser(userId) {
    if (!db.users[userId]) {
        db.users[userId] = { userId, balance: 0 };
        scheduleSave();
    }
}

function getUser(userId) {
    ensureUser(userId);
    return db.users[userId];
}

function addMoney(userId, amount, reason = null, executorId = null) {
    ensureUser(userId);
    const oldBalance = db.users[userId].balance;
    const newBalance = oldBalance + amount;
    db.users[userId].balance = newBalance;

    db.transactions.push({
        id: db.transactions.length + 1,
        userId,
        type: 'ADD',
        amount,
        oldBalance,
        newBalance,
        reason,
        executorId,
        timestamp: Date.now(),
    });

    scheduleSave();
    return newBalance;
}

function removeMoney(userId, amount, reason = null, executorId = null) {
    ensureUser(userId);
    const oldBalance = db.users[userId].balance;
    const newBalance = oldBalance - amount;
    db.users[userId].balance = newBalance;

    db.transactions.push({
        id: db.transactions.length + 1,
        userId,
        type: 'REMOVE',
        amount,
        oldBalance,
        newBalance,
        reason,
        executorId,
        timestamp: Date.now(),
    });

    scheduleSave();
    return newBalance;
}

function getTransactions(userId, limit = 5) {
    return db.transactions
        .filter((t) => t.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

function getAllUsers() {
    return Object.values(db.users).sort((a, b) => (b.balance || 0) - (a.balance || 0));
}

// ─── Cooldowns ────────────────────────────────────────────────────────────────

function getCooldown(userId) {
    return db.cooldowns[userId] || null;
}

function getCooldowns() {
    return Object.values(db.cooldowns);
}

function setCooldown(userId, channelId, endTime, initiatorId) {
    db.cooldowns[userId] = {
        id: Date.now(),
        userId,
        channelId,
        endTime,
        initiatorId,
    };
    scheduleSave();
}

function clearCooldown(userId, endTime) {
    const cd = db.cooldowns[userId];
    if (cd && (!endTime || cd.endTime === endTime)) {
        delete db.cooldowns[userId];
        scheduleSave();
    }
}

function removeCooldownByUserId(userId) {
    if (db.cooldowns[userId]) {
        delete db.cooldowns[userId];
        scheduleSave();
    }
}

// ─── Reminders ────────────────────────────────────────────────────────────────

function addReminder(userId, channelId, message, endTime, initiatorId) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    db.reminders[id] = {
        id,
        userId,
        channelId,
        message,
        endTime,
        initiatorId,
    };
    scheduleSave();
    return id;
}

function getReminders() {
    return Object.values(db.reminders);
}

function reminderExists(id) {
    return Boolean(db.reminders[id]);
}

function removeReminder(id) {
    if (db.reminders[id]) {
        delete db.reminders[id];
        scheduleSave();
    }
}

function removeRemindersByUserId(userId) {
    let changed = false;
    for (const [id, r] of Object.entries(db.reminders)) {
        if (r.userId === userId) {
            delete db.reminders[id];
            changed = true;
        }
    }
    if (changed) scheduleSave();
}

// ─── Guild / Tickets ──────────────────────────────────────────────────────────

function getGuildConfig(guildId) {
    return db.guilds[guildId] || {};
}

function setGuildConfig(guildId, data) {
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = { guildId, ticketCount: 0 };
    }
    db.guilds[guildId] = { ...db.guilds[guildId], ...data, guildId };
    scheduleSave();
}

function incrementTicketCount(guildId) {
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = { guildId, ticketCount: 0 };
    }
    db.guilds[guildId].ticketCount = (db.guilds[guildId].ticketCount || 0) + 1;
    scheduleSave();
    return db.guilds[guildId].ticketCount;
}

function getCategories(guildId) {
    return Object.values(db.categories).filter((c) => c.guildId === guildId);
}

function getCategory(id) {
    return db.categories[id] || null;
}

function createCategory(data) {
    db.categories[data.id] = {
        id: data.id,
        guildId: data.guildId,
        name: data.name,
        emoji: data.emoji,
        roles: typeof data.roles === 'string' ? data.roles : JSON.stringify(data.roles || []),
        categoryId: data.categoryId,
        maxTickets: data.maxTickets || 1,
        questions: typeof data.questions === 'string' ? data.questions : JSON.stringify(data.questions || []),
    };
    scheduleSave();
}

function deleteCategory(id) {
    if (db.categories[id]) {
        delete db.categories[id];
        scheduleSave();
    }
}

function createTicket(data) {
    db.tickets[data.channelId] = {
        channelId: data.channelId,
        guildId: data.guildId,
        userId: data.userId,
        categoryId: data.categoryId,
        status: 'open',
        claimantId: null,
        createdAt: data.createdAt || Date.now(),
        closedAt: null,
        answers: typeof data.answers === 'string' ? data.answers : JSON.stringify(data.answers || {}),
    };
    scheduleSave();
}

function getTicket(channelId) {
    return db.tickets[channelId] || null;
}

function updateTicket(channelId, data) {
    if (db.tickets[channelId]) {
        db.tickets[channelId] = { ...db.tickets[channelId], ...data };
        scheduleSave();
    }
}

function getUserActiveTickets(userId, guildId) {
    return Object.values(db.tickets).filter(
        (t) => t.userId === userId && t.guildId === guildId && t.status === 'open'
    );
}

function getUserTickets(userId, guildId) {
    return Object.values(db.tickets)
        .filter((t) => t.userId === userId && t.guildId === guildId)
        .sort((a, b) => b.createdAt - a.createdAt);
}

function isBlacklisted(guildId, userId) {
    return Boolean(db.blacklist[`${guildId}_${userId}`]);
}

// ─── Memory ───────────────────────────────────────────────────────────────────

function setMemory(slot, message) {
    db.memory[slot] = message;
    scheduleSave();
}

function getMemory(slot) {
    return db.memory[slot] || null;
}

function getAllMemory() {
    return { ...db.memory };
}

// ─── Brain Memories ────────────────────────────────────────────────────────────

function addBrainMemory(scope, scopeId, content) {
    db.brain_memories.push({
        id: db.brain_memories.length + 1,
        scope,
        scopeId: scopeId || null,
        content,
        timestamp: Date.now(),
    });
    scheduleSave();
}

function deleteBrainMemoryByKeyword(scope, scopeId, keyword) {
    const prevLen = db.brain_memories.length;
    const kw = keyword.toLowerCase();
    db.brain_memories = db.brain_memories.filter((m) => {
        if (m.scope !== scope) return true;
        if (scope !== 'global' && m.scopeId !== scopeId) return true;
        return !m.content.toLowerCase().includes(kw);
    });
    if (db.brain_memories.length !== prevLen) scheduleSave();
}

function getBrainMemories(scope, scopeId) {
    if (scope === 'global') {
        return db.brain_memories.filter((m) => m.scope === 'global');
    }
    return db.brain_memories.filter((m) => m.scope === scope && m.scopeId === scopeId);
}

function getAllRelevantBrainMemories(userId, guildId) {
    return db.brain_memories
        .filter((m) => {
            if (m.scope === 'global') return true;
            if (m.scope === 'user' && m.scopeId === userId) return true;
            if (m.scope === 'server' && m.scopeId === guildId) return true;
            return false;
        })
        .sort((a, b) => a.timestamp - b.timestamp);
}

// ─── UPI ─────────────────────────────────────────────────────────────────────

function setUpi(userId, guildId, upiId, qrUrl) {
    db.upi[`${userId}_${guildId}`] = {
        userId,
        guildId,
        upiId,
        qrUrl: qrUrl || null,
        savedAt: Date.now(),
    };
    scheduleSave();
}

function getUpi(userId, guildId) {
    return db.upi[`${userId}_${guildId}`] || null;
}

function deleteUpi(userId, guildId) {
    if (db.upi[`${userId}_${guildId}`]) {
        delete db.upi[`${userId}_${guildId}`];
        scheduleSave();
    }
}

function getAllUpi(guildId) {
    return Object.values(db.upi).filter((u) => u.guildId === guildId);
}

module.exports = {
    // Economy
    getUser, addMoney, removeMoney, getAllUsers, getTransactions,
    // Cooldowns
    getCooldown, getCooldowns, setCooldown, clearCooldown, removeCooldownByUserId,
    // Reminders
    addReminder, getReminders, reminderExists, removeReminder, removeRemindersByUserId,
    // Guild/Tickets
    getGuildConfig, setGuildConfig, incrementTicketCount,
    getCategories, getCategory, createCategory, deleteCategory,
    createTicket, getTicket, updateTicket, getUserActiveTickets, getUserTickets,
    isBlacklisted,
    // Memory
    setMemory, getMemory, getAllMemory,
    // Brain Memories
    addBrainMemory, deleteBrainMemoryByKeyword, getBrainMemories, getAllRelevantBrainMemories,
    // UPI
    setUpi, getUpi, deleteUpi, getAllUpi,
};
