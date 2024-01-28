import {
  AutoLoad,
  Command,
  CommandContext,
  Declare,
  Middlewares,
  OnOptionsReturnObject,
} from 'biscuitjs';
import DeferReply from '../../middlewares/deferReply';

@Declare({
  name: 'champion',
  description: 'Champion things',
})
@Middlewares([DeferReply])
@AutoLoad()
export default class ChampionCommand extends Command {
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
