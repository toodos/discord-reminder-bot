# 🎫 Ticket System Setup Guide

This guide explains how to integrate and configure the new modular ticket system.

## 🛠️ 1. Install Dependencies
Run the following command in your terminal to install the new required packages:

```bash
npm install better-sqlite3 discord-html-transcripts
```

## 🔌 2. Integration
Add these lines to your existing files:

### `index.js`
```javascript
const loadTickets = require('./src/tickets/index.js');
// ... after client is ready
client.once('ready', () => {
    // ... existing logic
    loadTickets(client); 
});
```

### `deploy-commands.js`
```javascript
const ticketCommands = require('./src/tickets/commands/register.js');
const commands = [
    // ... existing commands
    ...ticketCommands
];
```

## ⚙️ 3. Initial Setup
Once the bot is running with the new module:
1. Use `/setup` to configure your **Admin Role**, **Log Channel**, and **Transcript Channel**.
2. Create a category using `/category create`.
3. Post a ticket panel using `/panel create`.

## 📂 Configuration
The system uses SQLite, creating a `tickets.db` file automatically in `src/tickets/database/`.
