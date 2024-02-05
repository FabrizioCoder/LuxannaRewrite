import {
  AutoLoad,
  Command,
  CommandContext,
  Declare,
  Middlewares,
  OnOptionsReturnObject,
} from 'biscuitjs';

@Declare({
  name: 'account',
  description: 'Account management commands',
})
@AutoLoad()
@Middlewares(['DeferEphemeral'])
export default class AccountCommand extends Command {
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
