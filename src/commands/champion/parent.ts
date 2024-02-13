import {
  AutoLoad,
  Command,
  CommandContext,
  Declare,
  Middlewares,
  OnOptionsReturnObject,
} from 'biscuitjs';

@Declare({
  name: 'champion',
  description: 'Champion things',
})
@Middlewares(['DeferReply'])
@AutoLoad()
export default class ChampionCommand extends Command {
  async onOptionsError(
    ctx: CommandContext,
    returns: OnOptionsReturnObject
  ) {
    const errors = Object.entries(returns)
      .filter(([_, err]) => err.failed)
      .map(([key, err]) => `${key}: ${(err.value as any).message}`)
      .join('\n');

    return ctx.editOrReply({
      content: `⚠️ There was an error with the options:\n\`\`\`\n${errors}\n\`\`\``,
    });
  }

  onRunError(ctx: CommandContext, _: Error) {
    return ctx.editOrReply({
      content: `⚠️ An error occurred while trying to get the build. Please try again later.`,
    });
  }
}
