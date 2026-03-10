# Discord Reminder Bot

A simple Discord bot that allows users to set reminders via slash commands. The bot will notify the user via DM and ping them in a specified channel when the reminder expires.

## Setup Instructions

1.  **Create a Discord Application**:
    - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    - Create a new application and name it.
    - Go to the "Bot" tab and click "Reset Token" to get your bot token.
    - **Important**: Enable `Message Content Intent` under the "Privileged Gateway Intents" section.
    - Save your client ID from the "General Information" tab.

2.  **Environment Variables**:
    - Rename `.env.example` to `.env`.
    - Replace `your_bot_token_here` with your actual bot token.
    - Replace `your_client_id_here` with your actual client ID.

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Register Slash Commands**:
    Run the following command to register the `/remind` slash command with Discord:
    ```bash
    node deploy-commands.js
    ```

5.  **Invite the Bot**:
    - Go to the "OAuth2" -> "URL Generator" tab.
    - Select `bot` and `applications.commands` scopes.
    - Select `Send Messages` and `Read Message History` permissions.
    - Copy the generated URL and paste it into your browser to invite the bot to your server.

6.  **Run the Bot**:
    ```bash
    node index.js
    ```

## Usage

Use the following command to set a reminder:
- `/remind [time] [message] [channel]`

Example:
- `/remind time: 10m message: "Check the oven!"`
- `/remind time: 1h message: "Meeting starts now" channel: #general`
