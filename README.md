# ⚡ Oakawol System AI 🌐

A premium, all-in-one Discord bot designed with a **Cyberpunk/Sci-Fi** aesthetic! It features a fully autonomous **AI Network Interface**, a robust **Secure Economy System**, a unified **Admin Ticket System**, and a smart **Temporal Reminder System**. 💻🤖

---

## ⚡ Core Features

### 🤖 Autonomous AI Chat Interface
Jack into the bot natively! Powered by Pollinations AI with a multi-model fallback strategy.
- **Smart Protocol Execution**: The bot can execute its own commands directly if you ask it (e.g., "Add 500 ₹ to @user" or "Initiate cryosleep in 10m").
- **Mention to Uplink**: Simply ping the bot or DM it to spark up a seamless, contextual connection!

### 💰 Secure Economy System
Manage your server's local grid wealth with a secure cyber economy!
- **Global Network Board**: See who the biggest Netrunners are.
- **Encrypted Vaults**: Every user has a personal rupee balance.
- **Admin Overrides**: Inject users with credits or deduct them to balance the ledger.

### 🎫 Encrypted Ticket System
A professional, secure ticket system for supporting your grid operatives.
- **Operational Nodes**: Group tickets by purpose (e.g., Support, Bug Reports).
- **Interactive Terminals**: Open secure comms with a single button click.
- **Network Management**: Add or remove users from secure threads using a terminal interface.
- **Data Transcripts**: Automatically save an HTML core memory record of closed channels.

### ⏰ Reminder & Cryosleep System
Never miss an operation with precise temporal pings and DMs!
- **Temporal Beacons**: Set active reminders for yourself or others (e.g., `10m`, `1h`).
- **Hibernate (Cooldowns)**: Put users into "cryosleep" to manage network load.
- **System Pings**: The bot sends a direct neural ping when the timer expires.

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

## 📂 System Architecture
- `index.js`: Main logic core and socket routing.
- `deploy-commands.js`: Protocol deployment script.
- `utils/`: Neural logic modules (database, tickets, temporal).
- `data/`: Secure ledger (JSON).
- `tickets.db`: Comms database (SQLite).
- `assets/`: UI assets and holographic vectors used in the terminal.

---

End of line. Built in the neon glow of the grid. 💻🌐⚡🔋
