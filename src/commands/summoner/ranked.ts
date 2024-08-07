import { CommandContext, Declare, Options, SubCommand } from 'seyfert';
import { SummonersManager } from '../../app/managers/summonersManager';
import { searchOptions } from '../../utils/constants';
import { parseSummonerOptions } from '../../utils/functions';
import { makeRankedProfile } from '../../utils/images/ranked';
import { AttachmentBuilder } from 'seyfert/lib/builders';

@Declare({
  name: 'ranked',
  description: 'Get the summoner ranked stats',
})
@Options(searchOptions)
export default class RankedCommand extends SubCommand {
  async run(ctx: CommandContext<typeof searchOptions>) {
    const args = await parseSummonerOptions({
      user: ctx.options.user,
      userId: ctx.author.id,
      riotId: ctx.options['riot-id'],
      region: ctx.options.region,
    });

    if (!args) {
      return ctx.editOrReply({
        content: ctx.options.user
          ? ctx.t.commands.errors.noLinkedAccount.user.get()
          : ctx.t.commands.errors.noLinkedAccount.self.get(),
      });
    }

    const [gameName, tagLine] = args.riotId.split('#');
    const summoner = await SummonersManager.getInstance().get(
      `${args.region}:${gameName}:${tagLine}`
    );

    if (!summoner) {
      return ctx.editOrReply({
        content: "⚠️ I haven't found the summoner. Check the RiotId or the region.",
      });
    }

    const SummonerRankeds = await summoner.getLeague();
    const img = await makeRankedProfile(SummonerRankeds, summoner);

    return ctx.editOrReply({
      content: `Ranked stats for **${gameName}#${tagLine}** (${args.region.toUpperCase()})`,
      files: [
        new AttachmentBuilder()
          .setName('ranked.png')
          .setFile('buffer', img)
          .setDescription('Ranked stats'),
      ],
    });
  }
}
