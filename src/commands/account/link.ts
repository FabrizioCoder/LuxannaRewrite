import { ApplicationCommandOptionType } from '@biscuitland/common';
import {
  CommandContext,
  Declare,
  OKFunction,
  Options,
  StopFunction,
  SubCommand,
  createOption,
} from '@potoland/core';
import { SummonersManager } from '../../app/managers/summonersManager';
import { userModel } from '../../app/models/user';
import { RegionChoices } from '../../utils/constants';
import { ApplyCooldown } from '../../utils/functions';

const options = {
  'riot-id': createOption({
    description: 'When you want to add your account, your RiotId is required.',
    description_localizations: {
      'es-ES': 'Cuando quieres añadir tu cuenta, tu RiotId es requerido.',
    },
    required: true,
    type: 3,
    value(value: string, ok: OKFunction<string>, fail: StopFunction) {
      if (!value.includes('#'))
        fail(Error('The RiotId must include the "#". (FabrizioCoder#6030)'));
      ok(value);
    },
  }),
  region: createOption({
    description:
      'When you want to add your account, the region in which you play is required.',
    description_localizations: {
      'es-ES':
        'Cuando quieres añadir tu cuenta, la región en la que juegas es requerida.',
    },
    required: true,
    type: ApplicationCommandOptionType.String,
    choices: RegionChoices,
    value(value: string, ok: OKFunction<string>) {
      ok(value);
    },
  }),
};

@Declare({
  name: 'link',
  description: 'Link your League of Legends account to your Discord account.',
})
@ApplyCooldown({
  time: 10000,
  type: 'user',
})
@Options(options)
export default class LinkCommand extends SubCommand {
  async run(ctx: CommandContext<'client', typeof options>) {
    const [gameName, tagLine] = ctx.options['riot-id'].split('#');

    if (!gameName || !tagLine)
      return ctx.editOrReply({
        content: 'You must provide a valid RiotId.',
      });

    const check = await userModel.exists({ id: ctx.author.id });
    if (check)
      return ctx.editOrReply({
        content: 'You already have a linked account.',
      });

    const puuid = await SummonersManager.fetchByRiotId(
      gameName,
      tagLine,
      ctx.options.region
    );

    if (!puuid)
      return ctx.editOrReply({
        content: "The summoner doesn't exist",
      });

    await userModel.create({
      id: ctx.author.id,
      gameName,
      tagLine,
      puuid,
      region: ctx.options.region,
    });

    return ctx.editOrReply({
      content: `Your account (\`${gameName}#${tagLine}\`) has been linked successfully.`,
    });
  }
}
