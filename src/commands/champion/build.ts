import {
  OKFunction,
  CommandContext,
  Declare,
  Options,
  SubCommand,
  createStringOption,
} from 'seyfert';
import { ResultItems, ResultRunes, getBuild } from '../../utils/scraper';
import { EmbedColors, autoCompleteChampionValues } from '../../utils/constants';
import {
  capitalizeString,
  getChampionById,
  getEmote,
  getItemByName,
} from '../../utils/functions';
import runesJSON from '../../../json/new_perks.json';
import { Embed } from 'seyfert/lib/builders';

const roles = ['top', 'jungle', 'mid', 'adc', 'support'];

const searchOptions = {
  champion: createStringOption({
    description: 'Name of the champion you wish to obtain the build from.',
    required: true,
    value({ value }, ok: OKFunction<string>) {
      ok(value);
    },
    autocomplete: async (interaction) => {
      return await interaction.respond(autoCompleteChampionValues(interaction));
    },
  }),
  role: createStringOption({
    description: 'Role of the champion you wish to obtain the build from.',
    required: true,
    choices: roles.map((role) => {
      return {
        name: role,
        value: role,
      };
    }),
  }),
};

@Declare({
  name: 'build',
  description: 'Get the build of a champion',
})
@Options(searchOptions)
export default class BuildCommand extends SubCommand {
  async run(ctx: CommandContext<typeof searchOptions>) {
    const { champion: name, role } = ctx.options;
    const champion = getChampionById(name)!;

    if (!champion) {
      return await ctx.editOrReply({
        content: `⚠️ No champion found for **${name}**`,
      });
    }

    const build = await getBuild(name, role).catch(() => null);
    if (!build) {
      return await ctx.editOrReply({
        content: `⚠️ No build found for **${
          champion.name
        }** **${capitalizeString(role)}**`,
      });
    }

    const embedBuild = new Embed()
      .setTitle(`Build for **${champion.name}** **${capitalizeString(role)}**`)
      .setURL(build.baseUrl)
      .setColor(EmbedColors.BLUE)
      .setThumbnail(champion.image.full);

    const runesValue: ResultRunes = {
      first: [],
      second: [],
      perks: [],
      wr: '0%',
    };

    if (build.runes) {
      const { first, second, perks, wr } = build.runes;

      first.map((rune) => {
        Object.values(runesJSON)
          .filter((perk) => perk.name === rune)
          .map((perk) => {
            const firstRuneEmoji = getEmote(String(perk!.id))!;
            runesValue!.first.push(`${firstRuneEmoji} ${perk.name}`);
          });
      });

      second.map((rune) => {
        Object.values(runesJSON)
          .filter((perk) => perk.name === rune)
          .map((perk) => {
            const secondRuneEmoji = getEmote(String(perk!.id))!;
            runesValue!.second.push(`${secondRuneEmoji} ${perk.name}`);
          });
      });

      perks.map((rune) => {
        Object.values(runesJSON)
          .filter((perk) => perk.id === Number(rune))
          .map((perk) => {
            const perkEmoji = getEmote(String(perk!.id))!;
            runesValue!.perks.push(
              `${perkEmoji} ${perk.longDesc!.replace(/<[^>]*>?/gm, '')}`
            );
          });
      });
      runesValue!.wr = wr;
    }

    let itemsValue: ResultItems = {
      starterBuild: {
        items: [],
        wr: '0%',
      },
      coreBuild: {
        items: [],
        wr: '0%',
      },
      boots: {
        name: '',
        wr: '0%',
      },
    };

    if (build.items) {
      const { starterBuild, coreBuild, boots } = build.items;

      starterBuild.items.map((item) => {
        const { '0': id, '1': itemData } = getItemByName(item)!;
        const itemEmoji = getEmote(id)!;

        itemsValue.starterBuild.items.push(`${itemEmoji} ${itemData.name}`);
      });
      itemsValue.starterBuild.wr = starterBuild.wr;

      coreBuild.items.map((item) => {
        const { '0': id, '1': itemData } = getItemByName(item)!;
        const itemEmoji = getEmote(id)!;

        itemsValue.coreBuild.items.push(`${itemEmoji} ${itemData.name}`);
      });
      itemsValue.coreBuild.wr = coreBuild.wr;

      {
        const { '0': id, '1': itemData } = getItemByName(boots.name)!;
        const itemEmoji = getEmote(id)!;

        itemsValue.boots.name = `${itemEmoji} ${itemData.name}`;
        itemsValue.boots.wr = boots.wr;
      }
    }

    embedBuild.addFields([
      {
        name: runesValue ? `Runes (${runesValue.wr})` : 'Runes',
        value: runesValue
          ? [
              `**${runesValue.first[0]}**\n${runesValue.first
                .slice(1)
                .join('\n')}`,
              `\n**${runesValue.second[0]}**\n${runesValue.second
                .slice(1)
                .join('\n')}`,
              `\n${runesValue.perks.join('\n')}`,
            ].join('\n')
          : 'No runes found',
        inline: true,
      },
      {
        name: 'Items',
        value: itemsValue
          ? [
              `**Starter Build (${
                itemsValue.starterBuild.wr
              }):**\n${itemsValue.starterBuild.items.join('\n')}`,
              `**Core Build (${
                itemsValue.coreBuild.wr
              }):**\n${itemsValue.coreBuild.items.join('\n')}`,
              `**Boots (${itemsValue.boots.wr}):**\n${itemsValue.boots.name}`,
            ].join('\n')
          : 'No items found',
        inline: true,
      },
      {
        name: build.skillOrder
          ? `Skill Order (${build.skillOrder.wr})`
          : 'Skill Order',
        value: build.skillOrder
          ? `\`\`\`r\n${build.skillOrder.keys.join(' > ')}\n\`\`\``
          : 'No skill order found',
      },
    ]);

    return await ctx.editOrReply({ embeds: [embedBuild] });
  }
}
