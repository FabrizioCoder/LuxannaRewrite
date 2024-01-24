import {
    CommandContext,
    Declare,
    MessageEmbed,
    Options,
    SubCommand
} from 'biscuitjs';
import { SummonersManager } from '../../app/managers/summonersManager';
import { EmbedColors, searchOptions } from '../../utils/constants';
import {
    championEmoji,
    getChampionById,
    getEmote,
    makeIconURL,
    parseSummonerOptions
} from '../../utils/functions';
import { EmbedPaginator } from '../../utils/paginator';

@Declare({
    name: 'mastery',
    description: 'Get summoner mastery.',
})
@Options(searchOptions)
export default class MasteryCommand extends SubCommand {
    async run(ctx: CommandContext<'client', typeof searchOptions>) {
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
                content: 'Summoner not found.',
            });
        }
        const profileIconURL = makeIconURL('14.1.1', summoner.profileIconId);
        const SummonerMastery = await summoner.getMastery();
        const championMasteryData = await SummonerMastery.fetchAll();

        if (!championMasteryData?.length) {
            return ctx.editOrReply({
                content: ctx.t.commands.mastery.errors.noData.get(),
            });
        }

        const totalPoints = championMasteryData.reduce(
            (acc, cur) => acc + cur.championPoints,
            0
        );

        const embeds: MessageEmbed[] = [];
        const championMasteries = chunk(championMasteryData, 10)

        for (const championMastery of championMasteries) {
            const embed = new MessageEmbed()

            embed.addFields([
                {
                    name: ctx.t.commands.mastery.embed.fields.championAndPoints.get(),
                    value: championMastery.map(mastery => {
                        const champion = getChampionById({
                            key: String(mastery.championId),
                        })!;
                        const championEmote = championEmoji(champion.id);
                        const masteryEmote = getEmote(`${mastery.championLevel}_`);
                        return `${masteryEmote} ${championEmote} ${champion.name} (${mastery.championPoints.toLocaleString()})`
                    }).join('\n'),
                    inline: true,
                },
                {
                    name: ctx.t.commands.mastery.embed.fields.lastPlayed.get(),
                    value: championMastery.map(mastery => {
                        const formatLastPlayTime = `<t:${Math.floor(
                            mastery.lastPlayTime / 1000
                        )}:R>`;
                        const blank = getEmote('Missing_Champion');
                        return formatLastPlayTime + blank
                    }).join('\n'),
                    inline: true,
                },
                {
                    name: ctx.t.commands.mastery.embed.fields.chestGranted.get(),
                    value: championMastery.map(mastery => {
                        const chestGranted = mastery.chestGranted
                            ? getEmote('chest_acquired')
                            : getEmote('chest');
                        return chestGranted
                    }).join('\n'),
                    inline: true,
                },
            ]);

            embeds.push(embed)
        }

        const baseEmbed = new MessageEmbed({
            color: EmbedColors.BLUE,
            author: {
                name: `${args.riotId} (${args.region.toUpperCase()})`,
                icon_url: profileIconURL,
            },
            footer: {
                text: ctx.t.commands.mastery.baseEmbed.footer(ctx.author.tag).get(),
            },
            title: ctx.t.commands.mastery.baseEmbed.title(totalPoints).get(),
        });

        const paginator = new EmbedPaginator(ctx, embeds, baseEmbed);

        return ctx.editOrReply(paginator.start());
    }
}

function chunk<T>(array: T[], chunks: number): T[][] {
    let index = 0;
    let resIndex = 0;
    const result = Array(Math.ceil(array.length / chunks));

    while (index < array.length) {
        result[resIndex] = array.slice(index, (index += chunks));
        resIndex++;
    }

    return result;
}