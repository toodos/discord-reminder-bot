# 🎀 Cute Reminder & Economy Bot ✨

A premium, all-in-one Discord bot designed with a "cute" aesthetic! It features a robust **Economy System**, a unified **Ticket System**, and a smart **Reminder System**. 🌸🌷

---

## ✨ Core Features

### 💰 Economy System
Manage your server's wealth with a sparkly global economy!
- **Global Leaderboard**: See who the biggest ballers are.
- **Sparkly Vaults**: Every user has a personal balance.
- **Admin Controls**: Shower users with money or deduct it when needed.

### 🎫 Unified Ticket System
A professional, interaction-based ticket system for supporting your community.
- **Department Categories**: Group tickets by purpose (e.g., Support, Feedback).
- **Interactive Panels**: Open tickets with a single button click.
- **Staff Management**: Add or remove users from tickets using a cute select menu.
- **Transcripts**: Automatically save a beautiful HTML record of closed tickets.

### ⏰ Reminder & Cooldown System
Never miss a task with cute pings and DMs!
- **Smart Reminders**: Set reminders for yourself or others (e.g., `10m`, `1h`).
- **Nap Time (Cooldowns)**: Put users on a "cozy nap" to manage task assignments.
- **Auto-Notifications**: The bot sends a DM and pings the channel when time is up.

---

## 🛠️ Setup Instructions

### 1. Discord Portal Setup
- Go to the [Discord Developer Portal](https://discord.com/developers/applications).
- Create a new application and name it.
- **Bot Tab**:
    - Reset Token to get your bot token.
    - Enable **Message Content Intent**.
- **General Info**: Copy your Client ID.

### 2. Configuration (`.env`)
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_server_id_here  # Optional: For instant command updates!
```

### 3. Requirements
- Node.js (v16.11.0 or higher)
- Dependencies: `npm install`

### 4. Running the Bot
```bash
# Register commands (Run this whenever you change commands)
node deploy-commands.js

# Start the bot
node index.js
```

---

## 📋 All Commands

### 🌸 Reminders & Naps
| Command | Description |
| :--- | :--- |
| `/remind` | `time` `message` `[channel]` `[user]` - Set a reminder! |
| `/cd` | `user` `[time]` - Put a user in a cozy nap (cooldown). |
| `/remove_cd` | `user` - Wake someone up early! (Admin Only) |
| `/verify` | `[link]` - Manually verify a Reddit link. (Admin Only) |
| `Verify Link` | (Context Menu) Right-click a message to verify. (Admin Only) |

### 💰 Economy
| Command | Description |
| :--- | :--- |
| `/balance` | `[user]` - Peek into a sparkly personal vault. |
| `/add_money` | `user` `amount` - Shower a user with money! (Admin Only) |
| `/remove_money` | `user` `amount` - Take some money away. (Admin Only) |

### 🎫 Ticket Management (Admin Only)
| Command | Description |
| :--- | :--- |
| `/setup` | Configure log and transcript channels. |
| `/category create` | Create a ticket department with its own emoji and staff role. |
| `/category list` | List all active ticket categories and IDs. |
| `/category delete` | `id` - Remove a ticket category. |
| `/panel create` | Create a button panel in a channel for users to open tickets. |
| `/close` | Close the current ticket and generate a transcript. |

---

## 📂 Project Structure
- `index.js`: Main bot logic and interaction handling.
- `deploy-commands.js`: Command registration script.
- `utils/`: Core logic modules (database, tickets, timers).
- `data/`: Economy database (JSON).
- `tickets.db`: Ticket system database (SQLite).
- `assets/`: Cute images and icons used in embeds.

---

Created with love and sparkles! 🍭🌻✨🌷🍬
