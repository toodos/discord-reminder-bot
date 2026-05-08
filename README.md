# 🤖 Oakawol Automated Assistant ✨

A premium, all-in-one Discord bot designed with a **Clean & Cute Robotic** aesthetic! It features a fully autonomous **AI Support Interface**, a reliable **Secure Economy System**, a structured **Ticket System**, and a precise **Reminder System**. 📋🛠️

---

## ✨ Core Operational Features

### 🤖 Autonomous AI Chat Interface
Communicate with the bot natively! Powered by Pollinations AI with a multi-model fallback strategy.
- **Smart Protocol Execution**: The bot can execute its own commands directly if you politely ask it (e.g., "Could you add 500 ₹ to @user?" or "Schedule a recharge in 10m").
- **Mention to Uplink**: Simply ping the bot or DM it to spark up a seamless, contextual connection!
- **Persistent Memory Bank**: The bot actively remembers details about users and the server context across conversations.
- **Administrative Security**: Sensitive AI execution tools (such as modifying balances, managing channels, and reading server logs) are strictly protected by role-based guardrails, ensuring only Administrators can execute administrative actions via the AI.

#### 🧠 AI Capabilities & Tools
The AI is equipped with a massive toolkit (over 40+ dynamic tools!), allowing it to perform actions natively in chat without needing slash commands:
- **Moderation & Security**: React to/delete recent messages, timeout/kick/ban/unban users, set slowmode, and lock/unlock channels. *(Admin Only)*
- **Server Management**: Create/delete/rename channels, set topics, create/assign/remove roles, get server/user info, list roles/channels, pin messages, make announcements, send custom embeds, and DM users. *(Admin Only)*
- **Web & API Integrations**: Search Google and Reddit, fetch Cryptocurrency prices, get live weather, translate text, search GitHub users, check Minecraft servers, and search Urban Dictionary.
- **Fun & Utilities**: Generate AI images natively, create interactive polls, roll dice, flip coins, pick random items, fetch jokes, cat facts, dog images, memes, trivia, and inspirational quotes.
- **Memory Management**: The AI can persistently save (`set_memory`), retrieve (`get_memory`), and list (`list_memory`) information in its own memory slots to remember user preferences or server rules across sessions.

### 💰 Secure Economy System
Manage your server's funds efficiently with a reliable economic ledger.
- **Global Network Board**: See who the biggest contributors are.
- **Secure Vaults**: Every user has a personal Rupee (₹) balance.
- **Admin Adjustments**: Inject users with funds or deduct them to balance the ledger smoothly using `/add_money` and `/remove_money`.

### 💳 UPI & QR Storage System
Store user UPI IDs securely in the unified database!
- **QR Code Storage**: Upload representations of QR codes directly to the bot. Image buffers are translated into Base64 strings and stored strictly in the database, requiring zero local file management.
- **Access Vault**: View saved user UPI information and QR code embeds effortlessly using the `/upi` suite.

### 📋 Structured Ticket System
- **Support Departments**: Group tickets by purpose (e.g., Support, Bug Reports).
- **Interactive Terminals**: Open secure comms with a single button click via `/panel create`.
- **Network Management**: Add or remove users from support threads using a polite interface.
- **Data Transcripts**: Automatically save an HTML archive of closed channels for your records using `discord-html-transcripts`.

### ⏰ Reminder & Recharge System
Never miss an operation with polite temporal pings and DMs!
- **Scheduled Alarms**: Set active reminders for yourself or others (e.g., `10m`, `1h`) using `/remind`.
- **Recharge (Cooldowns)**: Put users into "recharge" mode to manage chat overload using `/cd`.
- **System Pings**: The bot sends a direct notification when the timer efficiently expires.

### 🎨 Fun & Creativity
- **Image Generation**: Use the `/imagine` slash command (or ask the AI natively) to generate high-quality AI images directly within Discord using advanced text-to-image models.

---

## 🛠️ Setup Instructions

### 1. Discord Portal Setup
- Go to the [Discord Developer Portal](https://discord.com/developers/applications).
- Create a new application and name it.
- **Bot Tab**:
    - Reset Token to get your bot token.
    - Enable **Message Content Intent**, **Server Members Intent**, and **Presence Intent** (if needed).
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
npm run deploy

# Start the bot
npm start
```

---

## 📋 All Executable Protocols (Slash Commands)

### ⚡ Temporal Commands
| Protocol | Description |
| :--- | :--- |
| `/remind` | `time` `payload` `[node]` `[user]` - Set a temporal beacon! |
| `/cd` | `user` `[duration]` - Put a user in cryosleep. |
| `/remove_cd` | `user` - Manually abort cryosleep! (Admin Only) |
| `/verify` | `[hash]` - Manually verify a secure link. (Admin Only) |
| `Verify Link` | (Context Menu) Right-click a datastream to verify. (Admin Only) |

### 💰 Secure Ledger (Credits & UPI)
| Protocol | Description |
| :--- | :--- |
| `/balance` | `[user]` - Access a secure data vault. |
| `/add_money` | `user` `amount` - Inject credits into a user's vault! (Admin Only) |
| `/remove_money` | `user` `amount` - Deduct credits. (Admin Only) |
| `/upi` | `set`/`get`/`delete`/`list` - Manage user UPI and Base64 QR storage records. |

### 🎫 Network Channels (Tickets) (Admin Only)
| Protocol | Description |
| :--- | :--- |
| `/setup` | Configure log and transcript databanks. |
| `/category create` | Create a comms node with its own protocols. |
| `/category list` | List all active nodes and UUIDs. |
| `/category delete` | `id` - Defrag a comms node. |
| `/panel create` | Deploy a terminal panel for users to open comms. |
| `/close` | Terminate the connection and generate an encrypted transcript. |

### 🎨 Fun & Utilities
| Protocol | Description |
| :--- | :--- |
| `/imagine` | `prompt` - Generate a custom AI image. |
| `/text` | (Admin Only) Protocol for handling text operations. |
| `/memory` | `view`/`clear` - Manage the AI's internal memory banks. (Admin Only) |

---

## 🗂️ Project Directory Structure
- `index.js`: Main operation core and socket routing.
- `deploy-commands.js`: Protocol deployment script.
- `commands/`: Modular command handlers grouped by category (`admin`, `economy`, `fun`, `reminders`, `tickets`).
- `events/`: Event handlers, including `messageCreate.js` where the core AI tool execution logic happens.
- `utils/`: Neural logic modules, including the extensive `aiTools.js` and `database.js`.
- `data/`: Stores the unified `blossom.db` (SQLite) containing all user, economy, and AI memory records.
- `assets/`: Adorable 3D robot vectors used in the message interfaces.

---

Beep boop! Processed with precision and a robotic smile. 🤖✨
