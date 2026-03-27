const fs = require('fs');
const path = require('path');

const cmds = {
  "tickets/setup.js": "Set up the ticketing system panel in a channel.",
  "tickets/panel.js": "Send the ticket creation panel to the current channel.",
  "tickets/close.js": "Close an active ticket.",
  "tickets/category.js": "Manage ticket categories (add/remove categories for users).",
  "reminders/remind.js": "Set a personal reminder to be pinged later.",
  "reminders/cd.js": "Set a cooldown timer for a user, restricting them from doing actions until the cooldown expires.",
  "fun/imagine.js": "Generate an AI image using Prompts via Pollinations.",
  "economy/remove_money.js": "Administratively remove coins/money from a user's balance.",
  "economy/balance.js": "Check your own or another user's current coin balance and leaderboard ranking.",
  "economy/add_money.js": "Administratively add coins/money to a user's balance.",
  "admin/text.js": "Send a pure text message or reply through the bot anonymously.",
  "admin/verify.js": "Verify a URL/Link manually so it stops being flagged by the ticket auto-moderator.",
  "admin/remove_cd.js": "Remove/Reset an active cooldown from a user prematurely.",
  "admin/memory.js": "View the bot's current memory usage and process stats."
};

for (const [file, desc] of Object.entries(cmds)) {
  const p = path.join('a:\\Not very usefull\\discord bot\\commands', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    const regex = /(name:\s*['"][a-zA-Z0-9_-]+['"],)/;
    if (content.match(regex) && !content.includes('description:')) {
      content = content.replace(regex, `$1\n    description: '${desc.replace(/'/g, "\\'")}',`);
      fs.writeFileSync(p, content);
      console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file}`);
    }
  } else {
    console.log(`Not found ${p}`);
  }
}
