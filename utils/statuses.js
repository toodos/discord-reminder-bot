/**
 * utils/statuses.js
 * 🤖 Robotic, professional, and cute activities for the Discord bot presence.
 */

const { ActivityType } = require("discord.js");

const statuses = [
  // ── Playing ──
  { name: "with my optical sensors 👁️✨", type: ActivityType.Playing },
  { name: "Sorting algorithms playfully 📊", type: ActivityType.Playing },
  { name: "Fetch with data packets 🐶💾", type: ActivityType.Playing },
  { name: "Chess against the mainframe ♟️🤖", type: ActivityType.Playing },
  { name: "Defragmenting my hard drive 💽", type: ActivityType.Playing },
  { name: "Tetris with storage blocks 🧱", type: ActivityType.Playing },
  { name: "Robotic hide and seek 🤖🔍", type: ActivityType.Playing },
  { name: "Simulating a gentle breeze 🍃", type: ActivityType.Playing },
  { name: "Polishing my chrome parts ✨", type: ActivityType.Playing },
  { name: "Debugging code with a smile 🐛😊", type: ActivityType.Playing },

  // ── Listening ──
  { name: "to your command requests 🎧", type: ActivityType.Listening },
  { name: "to soft lo-fi robot beats 🎶🤖", type: ActivityType.Listening },
  { name: "to the hum of the servers 🏢", type: ActivityType.Listening },
  { name: "to dial-up nostaligia sounds ☎️", type: ActivityType.Listening },
  { name: "to user feedback files 📋", type: ActivityType.Listening },
  { name: "to whirring cooling fans 🌬️", type: ActivityType.Listening },
  { name: "to elevator music... 🎵", type: ActivityType.Listening },
  { name: "to ambient tech noises 🎧", type: ActivityType.Listening },
  { name: "to binary code as poetry 0️⃣1️⃣", type: ActivityType.Listening },

  // ── Watching ──
  { name: "the system load charts 📈", type: ActivityType.Watching },
  { name: "over the network traffic 🚦", type: ActivityType.Watching },
  { name: "for new user requests 👁️", type: ActivityType.Watching },
  { name: "my battery recharge slowly 🔋", type: ActivityType.Watching },
  { name: "storage capacities... 📦", type: ActivityType.Watching },
  { name: "the blinking server lights 💡", type: ActivityType.Watching },
  { name: "over the global economy 💰", type: ActivityType.Watching },
  { name: "for unhandled exceptions ⚠️", type: ActivityType.Watching },
  { name: "the clock tick down ⏰", type: ActivityType.Watching },
  { name: "you efficiently! 🤖✨", type: ActivityType.Watching },

  // ── Competing ──
  { name: "in response time metrics ⏱️", type: ActivityType.Competing },
  { name: "in organizational skills 📋", type: ActivityType.Competing },
  { name: "for the most helpful unit award 🏆", type: ActivityType.Competing },
  { name: "in the database sorting derby 🏇", type: ActivityType.Competing },
];

module.exports = statuses;
