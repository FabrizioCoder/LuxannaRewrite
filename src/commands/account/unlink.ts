import { CommandContext, Declare, SubCommand } from "biscuitjs";
import { userModel } from "../../app/models/user";
import { ApplyCooldown } from "../../utils/functions";

@Declare({
  name: "unlink",
  description: "Unlink your account from your Discord account",
})
@ApplyCooldown({
  time: 10000,
  type: "user",
})
export default class LinkCommand extends SubCommand {
  async run(ctx: CommandContext<"client">) {
    const check = await userModel.exists({ id: ctx.author.id });
    if (!check) {
      return ctx.editOrReply({
        content: "⚠️ You don't have an account linked.",
      });
    }

    await userModel.deleteOne({ id: ctx.author.id });

    return ctx.editOrReply({
      content: "✅ Your account has been unlinked successfully.",
    });
  }
}