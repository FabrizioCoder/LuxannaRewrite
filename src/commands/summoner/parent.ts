import {
  AutoLoad,
  Command,
  CommandContext,
  Declare,
  Groups,
  Middlewares,
  OnOptionsReturnObject,
} from 'biscuitjs';

@Declare({
  name: 'summoner',
  description: 'Summoner things',
})
@Groups({
  matches: {
    defaultDescription: 'Summoner matches',
  },
})
@Middlewares(['DeferReply'])
@AutoLoad()
export default class SummonerCommand extends Command {
  async onOptionsError(ctx: CommandContext, returns: OnOptionsReturnObject) {
    const errors = Object.entries(returns)
      .filter(([_, err]) => err.failed)
      .map(([key, err]) => `${key}: ${(err.value as any).message}`)
      .join('\n');

    return ctx.editOrReply({
      content: `⚠️ There was an error with the options:\n\`\`\`\n${errors}\n\`\`\``,
    });
  }
  onRunError(context: CommandContext, error: unknown) {
    console.error(error);
    return context.editOrReply({
      content: `⚠️ There was an error running the command ([support server](https://discord.gg/heEhwCVekK)): \`\`\`\n${error}\n\`\`\``,
    });
  }
}
