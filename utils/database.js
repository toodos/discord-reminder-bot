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
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

function getData() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
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
    if (!data.users[userId]) {
        data.users[userId] = { balance: 0 };
    }
    data.users[userId].balance += amount;
    saveData(data);
    return data.users[userId].balance;
}

function removeMoney(userId, amount) {
    const data = getData();
    if (!data.users[userId]) {
        data.users[userId] = { balance: 0 };
    }
    data.users[userId].balance -= amount;
    // Allow negative balance or floor at 0? 
    // Usually economy bots allow negative or floor at 0. Let's floor at 0 for safety but user didn't specify.
    // Let's just allow it for now as "debt".
    saveData(data);
    return data.users[userId].balance;
}

module.exports = { getUser, addMoney, removeMoney };
