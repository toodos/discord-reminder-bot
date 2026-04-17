# 🤖 Oakawol Automated Assistant ✨

A premium, all-in-one Discord bot designed with a **Clean & Cute Robotic** aesthetic! It features a fully autonomous **AI Support Interface**, a reliable **Secure Economy System**, a structured **Ticket System**, and a precise **Reminder System**. 📋🛠️

---

## ✨ Core Operational Features

### 🤖 Autonomous AI Chat Interface
Communicate with the bot natively! Powered by Pollinations AI with a multi-model fallback strategy.
- **Smart Protocol Execution**: The bot can execute its own commands directly if you politely ask it (e.g., "Could you add 500 ₹ to @user?" or "Schedule a recharge in 10m").
- **Mention to Uplink**: Simply ping the bot or DM it to spark up a seamless, contextual connection!

### 💰 Secure Economy System
Manage your server's funds efficiently with a reliable economic ledger.
- **Global Network Board**: See who the biggest contributors are.
- **Secure Vaults**: Every user has a personal Rupee (₹) balance.
- **Admin Adjustments**: Inject users with funds or deduct them to balance the ledger smoothly.

### 📋 Structured Ticket System
A professional, secure ticket system for supporting your users.
- **Support Departments**: Group tickets by purpose (e.g., Support, Bug Reports).
- **Interactive Terminals**: Open secure comms with a single button click.
- **Network Management**: Add or remove users from support threads using a polite interface.
- **Data Transcripts**: Automatically save an HTML archive of closed channels for your records.

### ⏰ Reminder & Recharge System
Never miss an operation with polite temporal pings and DMs!
- **Scheduled Alarms**: Set active reminders for yourself or others (e.g., `10m`, `1h`).
- **Recharge (Cooldowns)**: Put users into "recharge" mode to manage chat overload.
- **System Pings**: The bot sends a direct notification when the timer efficiently expires.

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
POLLINATIONS_API_KEY=your_pollinations_api_key_here # Required for AI chat
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

## 📋 All Executable Protocols

### ⚡ Temporal Commands
| Protocol | Description |
| :--- | :--- |
| `/remind` | `time` `payload` `[node]` `[user]` - Set a temporal beacon! |
| `/cd` | `user` `[duration]` - Put a user in cryosleep. |
| `/remove_cd` | `user` - Manually abort cryosleep! (Admin Only) |
| `/verify` | `[hash]` - Manually verify a secure link. (Admin Only) |
| `Verify Link` | (Context Menu) Right-click a datastream to verify. (Admin Only) |

### 💰 Secure Ledger
| Protocol | Description |
| :--- | :--- |
| `/balance` | `[user]` - Access a secure data vault. |
| `/add_money` | `user` `amount` - Inject credits into a user's vault! (Admin Only) |
| `/remove_money` | `user` `amount` - Deduct credits. (Admin Only) |

### 🎫 Network Channels (Admin Only)
| Protocol | Description |
| :--- | :--- |
| `/setup` | Configure log and transcript databanks. |
| `/category create` | Create a comms node with its own protocols. |
| `/category list` | List all active nodes and UUIDs. |
| `/category delete` | `id` - Defrag a comms node. |
| `/panel create` | Deploy a terminal panel for users to open comms. |
| `/close` | Terminate the connection and generate an encrypted transcript. |

---

## 🗂️ Project Directory
- `index.js`: Main operation core and socket routing.
- `deploy-commands.js`: Protocol deployment script.
- `utils/`: Neural logic modules (database, tickets, temporal).
- `data/`: Secure ledger (JSON).
- `tickets.db`: Comms database (SQLite).
- `assets/`: Adorable 3D robot vectors used in the message interfaces.

---

Beep boop! Processed with precision and a robotic smile. 🤖✨
