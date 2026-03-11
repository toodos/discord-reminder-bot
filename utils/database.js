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
    if (!data.reminders) data.reminders = [];
    return data;
}

function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUser(userId) {
    const data = getData();
    if (!data.users[userId]) {
        data.users[userId] = { balance: 0 };
        saveData(data);
    }
    return data.users[userId];
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

function addReminder(userId, channelId, message, endTime, initiatorId) {
    const data = getData();
    const reminderId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    data.reminders.push({ id: reminderId, userId, channelId, message, endTime, initiatorId });
    saveData(data);
    return reminderId;
}

function getReminders() {
    return getData().reminders;
}

function removeReminder(reminderId) {
    const data = getData();
    data.reminders = data.reminders.filter(r => r.id !== reminderId);
    saveData(data);
}

function removeRemindersByUserId(userId) {
    const data = getData();
    data.reminders = data.reminders.filter(r => r.userId !== userId);
    saveData(data);
}

module.exports = {
    getUser, addMoney, removeMoney, setCooldown, getCooldowns,
    clearCooldown, removeCooldownByUserId, getAllUsers,
    addReminder, getReminders, removeReminder, removeRemindersByUserId
};
