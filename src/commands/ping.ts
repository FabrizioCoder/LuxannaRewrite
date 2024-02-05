import { Command, CommandContext, Declare, Middlewares } from 'biscuitjs';
import { ApplyCooldown } from '../utils/functions';

@Declare({
  name: 'ping',
  description: 'Show the ping with discord',
})
@Middlewares(['DeferReply', 'Cooldown'])
@ApplyCooldown({
  time: 5000,
  type: 'user',
})
export default class PingCommand extends Command {
  async run(ctx: CommandContext<'client'>) {
    const shardPing = () => ctx.client.gateway.get(ctx.shardId)?.latency ?? 0;

    return await ctx.editOrReply({
      content: `Pong! (gateway#${ctx.shardId}: ${shardPing()}ms)`,
    });
  }
}
