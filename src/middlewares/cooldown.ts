import { Collection, Snowflake } from '@biscuitland/common';
import { createMiddleware } from '@potoland/core';
import { Ratelimit } from '../utils/constants';

const cooldowns = new Collection<
  Snowflake,
  {
    data: Ratelimit;
    executedAt: number;
  }
>();

export default createMiddleware<void>(async (middle) => {
  const commandCooldown = middle.context.resolver.parent?.ratelimit;
  if (!commandCooldown) return middle.next();

  const commmandName = middle.context.resolver.fullCommandName;

  // can be written as middle.context.interaction.channel?.id || middle.context.author.id
  const id =
    commandCooldown.type === 'channel'
      ? middle.context.interaction.channel?.id
      : middle.context.author.id;
  const key = `${id}:${commmandName}`;

  const currentCooldown = cooldowns.get(key);
  if (!currentCooldown) {
    cooldowns.set(key, {
      data: commandCooldown,
      executedAt: Date.now(),
    });
    return middle.next();
  }

  const now = Date.now();
  const expirationTime = currentCooldown.executedAt + currentCooldown.data.time;

  if (expirationTime < now) {
    cooldowns.delete(key);
    return middle.next();
  }

  const timeLeft = (expirationTime - now) / 1000;
  switch (commandCooldown.type) {
    case 'user':
      await middle.context.interaction.editOrReply({
        content: middle.context.t('system.cooldown.user', {
          time: `**${timeLeft.toFixed(1)}**`,
        }),
      });
      middle.stop(new Error(`cooldown (user: ${id})`));
      break;
    case 'channel':
      await middle.context.interaction.editOrReply({
        content: middle.context.t('system.cooldown.channel', {
          time: `**${timeLeft.toFixed(1)}**`,
        }),
      });
      middle.stop(new Error(`cooldown (channel: ${id})`));
      break;
  }

  middle.next();
});
