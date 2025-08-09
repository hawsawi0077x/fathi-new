const { voiceClient } = require('./client.js');
const tokens = require('./tokens.js');
const express = require('express');
const { fetch } = require('undici');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const url = process.env.URL || 'https://four-aluminum-charger.glitch.me/';

app.get('/', (req, res) => res.send('Hello World!'));
app.head('/', (req, res) => res.sendStatus(200));
app.listen(port, () => console.log(`Server running at ${url} on port ${port}`));

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

setInterval(async () => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`HEAD ping (${response.status})`);
  } catch (error) {
    console.error('Ping error:', error);
  }
}, 300000);

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const randomDelay = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const cleanTokens = tokens.filter((t) => t?.token?.length > 30);

(async () => {
  for (const tokenConfig of cleanTokens) {
    const client = new voiceClient({
      token: tokenConfig.token,
      serverId: tokenConfig.serverId,
      channelId: tokenConfig.channelId,
      selfMute: tokenConfig.selfMute ?? true,
      selfDeaf: tokenConfig.selfDeaf ?? true,
      autoReconnect: tokenConfig.autoReconnect || { enabled: true, delay: 30000, maxRetries: 5 },
      presence: tokenConfig.presence,
    });

    client.on('ready', (user) => {
      console.log(`✅ Logged in as ${user.username}#${user.discriminator}`);
    });

    client.on('connected', () => console.log('🌐 Connected to Discord'));

    client.on('disconnected', () => {
      console.log('❌ Disconnected');
      // لا داعي لإعادة الاتصال من هنا لأن client.js فيه autoReconnect
    });

    client.on('voiceReady', () => console.log('🔊 Voice is ready'));
    client.on('error', (e) => console.error('❗ Error:', e));
    client.on('debug', (msg) => console.debug(msg));

    try {
      await client.connect();
    } catch (e) {
      console.error('❗ Initial connect failed:', e);
    }

    await wait(randomDelay(6000, 12000)); // تأخير عشوائي لتجنب identify rate limit
  }
})();
