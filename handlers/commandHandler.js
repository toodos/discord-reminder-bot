/**
 * handlers/commandHandler.js
 * Auto-loads all command files from the commands directory.
 */
const fs   = require('fs');
const path = require('path');

function loadCommands() {
    const commands = new Map();
    const commandsPath = path.join(__dirname, '../commands');

    for (const folder of fs.readdirSync(commandsPath)) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
            const command = require(path.join(folderPath, file));
            if (!command.name || !command.execute) {
                console.warn(`[CommandHandler] Skipping ${file} — missing name or execute.`);
                continue;
            }
            commands.set(command.name, command);
        }
    }

    console.log(`[CommandHandler] Loaded ${commands.size} commands.`);
    return commands;
}

module.exports = { loadCommands };
