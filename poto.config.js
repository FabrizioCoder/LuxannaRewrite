// @ts-check is better
const { config } = require('@potoland/core');

module.exports = config.bot({
  // @ts-ignore
  token: process.env.BT,
  intents: 0,
  locations: {
    base: 'src',
    output: 'dist',
    commands: 'commands',
    langs: 'languages',
    events: 'events',
  },
});
