import { MessageEmbed } from '@biscuitland/helpers';
import { CommandContext, Declare, Options, SubCommand } from '@potoland/core';
import { SummonersManager } from '../../app/managers/summonersManager';
import { EmbedColors, searchOptions } from '../../utils/constants';
import {
  calculateWinrate,
  capitalizeString,
  getEmote,
  makeIconURL,
  parseSummonerOptions,
} from '../../utils/functions';

@Declare({
  name: 'ranked',
  description: 'Get the summoner ranked stats',
})
@Options(searchOptions)
export default class RankedCommand extends SubCommand {
  async run(ctx: CommandContext<'client', typeof searchOptions>) {
    function formatRanked(league: {
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
    }) {
      return `${getEmote(capitalizeString(league.tier))} ${capitalizeString(
        league.tier
      )} ${league.rank} **${league.lp}** LP\n**${league.wins}**W **${
        league.losses
      }**L **${calculateWinrate(league.wins, league.losses)}%** WR`;
    }

    const args = await parseSummonerOptions({
      user: ctx.options.user,
      userId: ctx.author.id,
      riotId: ctx.options['riot-id'],
      region: ctx.options.region,
    });

    if (!args)
      return ctx.editOrReply({
        content:
          "You don't have a linked account. Enter your RiotId and region or you can also link your account with `/account link`.",
      });

    const [gameName, tagLine] = args.riotId.split('#');
    const summoner = await SummonersManager.getInstance().getSummoner(
      `${args.region}:${gameName}:${tagLine}`
    );

    if (!summoner)
      return ctx.editOrReply({
        content: 'Summoner not found',
      });

    const SummonerRankeds = await summoner.getLeague();
    // const img = await makeRankedProfile(SummonerRankeds);

    // return ctx.editOrReply(
    //   {
    //     content: 'Ranked profile',
    //   },
    //   [
    //     {
    //       data: img,
    //       name: 'ranked.png',
    //     },
    //   ]
    // );
    const soloQ = await SummonerRankeds.getSoloQueue();
    const flex = await SummonerRankeds.getFlexQueue();

    const RankedEmbed = new MessageEmbed()
      .setColor(EmbedColors.BLUE)
      .setAuthor({
        name: `${args.riotId} [${summoner.region.toUpperCase()}]`,
        iconUrl: makeIconURL('13.24.1', summoner.profileIconId),
      })
      .setTitle('Ranked Profile')
      .addFields([
        soloQ
          ? {
              name: 'Solo/Duo',
              value: formatRanked({
                tier: soloQ.tier!,
                rank: soloQ.rank!,
                lp: soloQ.leaguePoints,
                wins: soloQ.wins,
                losses: soloQ.losses,
              }),
              inline: true,
            }
          : {
              name: 'Solo/Duo',
              value: `${getEmote('Unranked')} *Unranked*`,
              inline: true,
            },
        flex
          ? {
              name: 'Flex',
              value: formatRanked({
                tier: flex.tier!,
                rank: flex.rank!,
                lp: flex.leaguePoints,
                wins: flex.wins,
                losses: flex.losses,
              }),
              inline: true,
            }
          : {
              name: 'Flex',
              value: `${getEmote('Unranked')} *Unranked*`,
              inline: true,
            },
      ]);

    return ctx.editOrReply({
      embeds: [RankedEmbed.toJSON()],
    });
  }
}
