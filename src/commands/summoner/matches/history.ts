import {
  CommandContext,
  Declare,
  Group,
  Middlewares,
  OKFunction,
  Options,
  SubCommand,
  createStringOption,
} from 'seyfert';
import { ApplyCooldown, parseSummonerOptions } from '../../../utils/functions';
import { makeMatchHistory } from '../../../utils/images/history';
import { QueueChoices, searchOptions } from '../../../utils/constants';
import { SummonersManager } from '../../../app/managers/summonersManager';
import { AttachmentBuilder } from 'seyfert/lib/builders';

const opt = {
  queue: createStringOption({
    choices: QueueChoices,
    required: false,
    description: 'Select a queue to filter the matches',
    value: ({ value }, ok: OKFunction<string>) => {
      ok(value as string);
    },
  }),
  'riot-id': searchOptions['riot-id'],
  region: searchOptions.region,
  user: searchOptions.user,
};

@Declare({
  name: 'history',
  description: 'Show summoner match history',
})
@Middlewares(['Cooldown'])
@ApplyCooldown({
  time: 5000,
  type: 'user',
})
@Group('matches')
@Options(opt)
export default class HistoryCommand extends SubCommand {
  async run(ctx: CommandContext<typeof opt>) {
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

    const queue = ctx.options.queue;

    const matchesId =
      (await (await summoner.getMatches()).fetchHistory(parseInt(queue!)!)) ??
      [];

    if (!matchesId || !matchesId.length) {
      return ctx.editOrReply({
        content: 'No matches found.',
      });
    }

    const matches = await Promise.all(
      matchesId.map((x) => summoner.match?.fetchById(x))
    );

    const buffer = await makeMatchHistory(matches as any, summoner, ctx);

    ctx.editOrReply({
      content: `Match history for **${gameName}#${tagLine}** (${args.region.toUpperCase()})`,

      files: [
        new AttachmentBuilder()
          .setName('match_history.png')
          .setFile('buffer', buffer)
          .setDescription('Match history'),
      ],
    });
  }
}
