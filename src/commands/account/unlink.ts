import { CommandContext, Declare, SubCommand } from 'biscuitjs';
import { userModel } from '../../app/models/user';
import { ApplyCooldown } from '../../utils/functions';

@Declare({
  name: 'unlink',
  description: 'Unlink your account from your discord account.',
})
@ApplyCooldown({
  time: 10000,
  type: 'user',
})
export default class LinkCommand extends SubCommand {
  async run(ctx: CommandContext<'client'>) {
    const check = await userModel.exists({ id: ctx.author.id });
    if (!check) {
      return ctx.editOrReply({
        content: 'You do not have an account linked.',
      });
    }

    return ctx.editOrReply({
      content: 'Your account has been unlinked successfully.',
    });
  }
}
