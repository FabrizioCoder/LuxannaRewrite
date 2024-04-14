import { APIMessageComponentInteraction, ButtonStyle } from 'seyfert/lib/types';
import { CommandContext } from 'seyfert';
import {
  ActionRow,
  AttachmentBuilder,
  Button,
  Embed,
} from 'seyfert/lib/builders';
import {
  ComponentInteraction,
  Message,
  StringSelectMenuInteraction,
  WebhookMessage,
} from 'seyfert/lib/structures';

export class EmbedPaginator {
  private currentPage = 0;
  private emojis: IObject;
  constructor(
    private context: CommandContext,
    private pages: Embed[],
    private baseEmbed: Embed,
    private files: AttachmentBuilder[]
  ) {
    this.emojis = {
      first: '⏮️',
      previous: '◀️',
      next: '▶️',
      last: '⏭️',
    };
  }

  async start() {
    const response = await this.context.interaction.editOrReply(
      {
        embeds: [this.getEmbed(this.pages[this.currentPage]!)],
        components: [this.getComponets()],
        files: this.files || [],
      },
      true
    );

    const collector = this.getCollector(response);

    for (const button of ['first', 'previous', 'next', 'last']) {
      collector.run(button, async (interaction) => {
        switch (button) {
          case 'first':
            this.currentPage = 0;
            break;
          case 'previous':
            this.currentPage--;
            break;
          case 'next':
            this.currentPage++;
            break;
          case 'last':
            this.currentPage = this.pages.length - 1;
            break;
        }

        await this.changePage(this.pages[this.currentPage]!, interaction);
      });
    }
  }

  private getComponets() {
    const row = new ActionRow();
    row.addComponents([
      new Button()
        .setCustomId('first')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.first)
        .setDisabled(!this.currentPage),
      new Button()
        .setCustomId('previous')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.previous)
        .setDisabled(!this.currentPage),
      new Button()
        .setCustomId('next')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.next)
        .setDisabled(!(this.pages.length > this.currentPage + 1)),
      new Button()
        .setCustomId('last')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.last)
        .setDisabled(this.currentPage + 1 === this.pages.length),
    ]);

    return row;
  }

  private getCollector(response: WebhookMessage | Message) {
    const collector = response.createComponentCollector({
      timeout: 60000,
      filter: (i) => i.user.id === this.context.author.id,
      onStop: async (reason) => {
        if (reason === 'timeout') {
          await this.context.editOrReply({
            components: [],
          });
        }
      },
    });

    return collector;
  }

  private async changePage(
    page: Embed,
    interaction:
      | ComponentInteraction<boolean, APIMessageComponentInteraction>
      | StringSelectMenuInteraction<string[]>
  ) {
    const embed = this.getEmbed(page);
    await interaction.update({
      embeds: [embed],
      components: [this.getComponets()],
    });
  }

  private getEmbed(embed: Embed) {
    const result = new Embed({
      ...this.baseEmbed.data,
      ...embed.data,
    }).setFooter({
      text: this.baseEmbed.data.footer
        ? `${this.baseEmbed.data.footer.text} | Page ${this.currentPage + 1}/${
            this.pages.length
          }`
        : `Page ${this.currentPage + 1}/${this.pages.length}`,
    });
    return result;
  }
}

export interface IObject {
  [index: string]: any;
}
