// @ts-check is better
const { config } = require('biscuitjs');

require('dotenv/config');

module.exports = config.bot({
  token: process.env.BT ?? '',
  intents: 0,
  locations: {
    base: 'src',
    output: 'dist',
    commands: 'commands',
    events: 'events',
    langs: 'locales',
  },
});
