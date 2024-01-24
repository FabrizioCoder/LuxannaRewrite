import { Paginator } from 'array-paginator';
import {
  CommandContext,
  ChatInputCommandInteraction,
  ActionRow,
  Button,
  ButtonStyle,
  ComponentsListener,
  MessageFlags,
  MessageEmbed,
  ButtonInteraction,
  APIInteractionResponseCallbackData,
} from 'biscuitjs';

export class EmbedPaginator {
  context: CommandContext<'client'>;
  pager: Paginator<MessageEmbed>;
  emojis: IObject;
  interaction: ChatInputCommandInteraction | null;
  constructor(context: CommandContext<'client'>, pages: MessageEmbed[]) {
    this.context = context;
    this.pager = new Paginator(pages, 1, 0);
    this.interaction = null;
    this.emojis = {
      first: '⏮️',
      previous: '◀️',
      next: '▶️',
      last: '⏭️',
    };
  }

  start() {
    return {
      embeds: this.pager.first()!,
      components: this.getListener().addRows(this.getComponets()),
    } as Omit<APIInteractionResponseCallbackData, 'embeds' | 'components'>;
  }

  getComponets() {
    const row = new ActionRow();
    row.addComponents([
      new Button()
      .setCustomId('first')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(this.emojis.first)
      .setDisabled(!this.pager.hasFirst())
      .run((interaction) => {
        this.changePage(this.pager.first()!, interaction);
      }),
      new Button()
      .setCustomId('previous')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(this.emojis.previous)
      .setDisabled(!this.pager.hasPrevious())
      .run((interaction) => {
        this.changePage(this.pager.previous()!, interaction);
      }),
      new Button()
      .setCustomId('next')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(this.emojis.next)
      .setDisabled(!this.pager.hasNext())
      .run((interaction) => {
        this.changePage(this.pager.next()!, interaction);
      }),
      new Button()
      .setCustomId('last')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(this.emojis.last)
      .setDisabled(!this.pager.hasLast())
      .run((interaction) => {
        this.changePage(this.pager.last()!, interaction);
      }),
    ]);

    return row;
  }

  getListener() {
    const componentsListener = new ComponentsListener({
      timeout: 30000,
      filter: (interaction) => {
        if (interaction.user.id !== this.context.author.id) {
          interaction.write({
            content: `⚠️ ${interaction.user.toString()}, you can't use this button.`,
            flags: MessageFlags.Ephemeral,
          });
          return false;
        }

        return true;
      },
      onStop: async (reason) => {
        if (reason === 'timeout') {
          await this.context.editOrReply({
            components: [],
          });
        }
      },
    });

    return componentsListener;
  }

  changePage(page: MessageEmbed[], interaction: ButtonInteraction) {
    interaction.editOrReply({
      embeds: page,
      components: this.getListener().addRows(this.getComponets()),
    });
  }
}

export interface IOptions {
  summoner: string;
}
export interface IObject {
  [index: string]: any;
}
