import { AutoLoad, Command, CommandContext, Declare, Groups, Middlewares, OnOptionsReturnObject } from '@potoland/core';
import DeferReply from '../../middlewares/deferReply';

@Declare({
  name: 'summoner',
  description: 'Summoner things',
})
@Groups({
  matches: {
    defaultDescription: 'Summoner matches',
  }
})
@Middlewares([DeferReply])
@AutoLoad()
export default class SummonerCommand extends Command {
  async onOptionsError(
    ctx: CommandContext<'client'>,
    returns: OnOptionsReturnObject
  ) {
    const errors = Object.entries(returns)
      .filter(([_, err]) => err.failed)
      .map(([key, err]) => `${key}: ${err.value.message}`)
      .join('\n');

    return ctx.editOrReply({
      content: `⚠️ There was an error with the options:\n\`\`\`\n${errors}\n\`\`\``,
    });
  }
}
