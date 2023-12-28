import { createEvent } from '@potoland/core';

export default createEvent({
  data: { once: true, name: 'ready' },
  async run(user, client, shard) {
    await client.uploadCommands().catch(console.log);
    client.logger.info(`Start "${user.tag}" on shard #${shard}`);
  },
});
