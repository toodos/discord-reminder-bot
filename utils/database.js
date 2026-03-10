const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Ensure database file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, cooldowns: [] }, null, 2));
}

function getData() {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!data.cooldowns) data.cooldowns = [];
    return data;
}

function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUser(userId) {
    const data = getData();
    if (!data.users[userId]) {
        data.users[userId] = {
            balance: 0,
            xp: 0,
            level: 1,
            lastDaily: 0
        };
        saveData(data);
    }
    // Migration: ensure new fields exist for old users
    let changed = false;
    if (data.users[userId].xp === undefined) { data.users[userId].xp = 0; changed = true; }
    if (data.users[userId].level === undefined) { data.users[userId].level = 1; changed = true; }
    if (data.users[userId].lastDaily === undefined) { data.users[userId].lastDaily = 0; changed = true; }
    if (changed) saveData(data);

    return data.users[userId];
}

function addXP(userId, amount) {
    const data = getData();
    const user = getUser(userId); // Ensure user exists/fields initialized
    const userData = data.users[userId];

    userData.xp += amount;

    const xpNeeded = userData.level * 100 * 1.5; // Example scaling: 150, 300, 450...
    if (userData.xp >= xpNeeded) {
        userData.level += 1;
        userData.xp = 0; // Reset XP on level up (or keep overflow, but let's keep it simple)
        saveData(data);
        return { leveledUp: true, newLevel: userData.level };
    }

    saveData(data);
    return { leveledUp: false };
}

function claimDaily(userId) {
    const data = getData();
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < cooldown) {
        return { success: false, nextAvailable: user.lastDaily + cooldown };
    }

    const reward = 500; // Daily reward amount
    user.balance += reward;
    user.lastDaily = now;
    saveData(data);
    return { success: true, amount: reward };
}

function addMoney(userId, amount) {
    const data = getData();
    getUser(userId);
    data.users[userId].balance += amount;
    saveData(data);
    return data.users[userId].balance;
}

function removeMoney(userId, amount) {
    const data = getData();
    getUser(userId);
    data.users[userId].balance -= amount;
    saveData(data);
    return data.users[userId].balance;
}

function setCooldown(userId, channelId, endTime, initiatorId) {
    const data = getData();
    data.cooldowns.push({ userId, channelId, endTime, initiatorId });
    saveData(data);
}

function getCooldowns() {
    return getData().cooldowns;
}

function clearCooldown(userId, endTime) {
    const data = getData();
    data.cooldowns = data.cooldowns.filter(c => !(c.userId === userId && c.endTime === endTime));
    saveData(data);
}

function removeCooldownByUserId(userId) {
    const data = getData();
    data.cooldowns = data.cooldowns.filter(c => c.userId !== userId);
    saveData(data);
}

function getAllUsers() {
    return getData().users;
}

module.exports = { getUser, addMoney, removeMoney, setCooldown, getCooldowns, clearCooldown, removeCooldownByUserId, getAllUsers, addXP, claimDaily };
