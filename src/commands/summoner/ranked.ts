import { CommandContext, Declare, Options, SubCommand } from '@potoland/core';
import { SummonersManager } from '../../app/managers/summonersManager';
import {
  capitalizeString,
  getEmote,
  makeIconURL,
  parseSummonerOptions,
} from '../../utils/functions';
import { MessageEmbed } from '@biscuitland/helpers';
import { EmbedColors, searchOptions } from '../../utils/constants';

@Declare({
  name: 'ranked',
  description: 'Get the summoner ranked stats',
})
@Options(searchOptions)
export default class RankedCommand extends SubCommand {
  async run(ctx: CommandContext<'client', typeof searchOptions>) {
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
    const soloQ = await SummonerRankeds.getSoloQueue();
    const flexQ = await SummonerRankeds.getFlexQueue();

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
              value: `${getEmote(
                capitalizeString(soloQ.tier!)
              )} ${capitalizeString(soloQ.tier!)} ${soloQ.rank} ${
                soloQ.leaguePoints
              } LP`,
              inline: true,
            }
          : {
              name: 'Solo/Duo',
              value: `${getEmote('Unranked')} *Unranked*`,
              inline: true,
            },
        flexQ
          ? {
              name: 'Flex',
              value: `${getEmote(
                capitalizeString(flexQ.tier!)
              )} ${capitalizeString(flexQ.tier!)} ${flexQ.rank} ${
                flexQ.leaguePoints
              } LP`,
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
