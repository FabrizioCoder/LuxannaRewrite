import {
    ApplicationCommandOptionType,
    CommandContext,
    Declare,
    Group,
    Middlewares,
    OKFunction,
    Options,
    SubCommand,
    createOption,
} from '@potoland/core';
import { ApplyCooldown, parseSummonerOptions } from '../../../utils/functions';
import { makeMatchHistory } from '../../../utils/images/history';
import { QueueChoices, searchOptions } from '../../../utils/constants';
import { SummonersManager } from '../../../app/managers/summonersManager';
import Cooldown from '../../../middlewares/cooldown';

const opt = {
    queue: createOption({
        choices: QueueChoices,
        type: ApplicationCommandOptionType.String,
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
@Middlewares([Cooldown])
@ApplyCooldown({
    time: 5000,
    type: 'user',
})
@Group('matches')
@Options(opt)
export default class HistoryCommand extends SubCommand {
    async run(ctx: CommandContext<'client', typeof opt>) {
        const args = await parseSummonerOptions({
            user: ctx.options.user,
            userId: ctx.author.id,
            riotId: ctx.options['riot-id'],
            region: ctx.options.region,
        });

        if (!args) {
            return ctx.editOrReply({
                content:
                    "You don't have a linked account. Enter your RiotId and region or you can also link your account with `/account link`.",
            });
        }

        const [gameName, tagLine] = args.riotId.split('#');
        const summoner = await SummonersManager.getInstance(ctx.client).getSummoner(
            `${args.region}:${gameName}:${tagLine}`
        );

        if (!summoner) {
            return ctx.editOrReply({
                content: 'Summoner not found.',
            });
        }

        const queue = ctx.options.queue;

        const matchesId = await (await summoner.getMatches()).getMatchesHistory(parseInt(queue)!) ?? [];

        if (!matchesId || !(matchesId).length) {
            return ctx.editOrReply({
                content: 'No matches found.',
            });
        }

        const matches = await Promise.all((matchesId).map((x) => summoner.match?.getMatchById(x)));

        const buffer = await makeMatchHistory(matches as any, summoner);

        ctx.editOrReply(
            {
                content: `Match history for **${gameName}#${tagLine}** (${args.region.toUpperCase()})`,
            },
            [
                {
                    data: buffer,
                    name: 'match-history.png',
                    contentType: 'image/png',
                    key: 'attachments',
                },
            ]
        );
    }
}
