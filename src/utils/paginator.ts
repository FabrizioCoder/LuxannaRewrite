import { ButtonStyle, MessageFlags } from 'biscuitjs/lib/common';
import { CommandContext, ComponentsListener } from 'biscuitjs';
import { ActionRow, Button, Embed } from 'biscuitjs/lib/builders';
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
} from 'biscuitjs/lib/structures';

export class EmbedPaginator {
  currentPage = 0;
  emojis: IObject;
  interaction?: ChatInputCommandInteraction;
  constructor(
    public context: CommandContext,
    public pages: Embed[],
    public baseEmbed: Embed
  ) {
    this.emojis = {
      first: '⏮️',
      previous: '◀️',
      next: '▶️',
      last: '⏭️',
    };
  }

  start() {
    return {
      embeds: [this.getEmbed(this.pages[0]!)],
      components: this.getListener().addRows(this.getComponets()),
    };
  }

  getComponets() {
    const row = new ActionRow();
    row.addComponents([
      new Button()
        .setCustomId('first')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.first)
        .setDisabled(!this.currentPage)
        .run(async (interaction) => {
          this.currentPage = 0;
          await this.changePage(this.pages[0]!, interaction);
        }),
      new Button()
        .setCustomId('previous')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.previous)
        .setDisabled(!this.currentPage)
        .run(async (interaction) => {
          await this.changePage(this.pages[--this.currentPage]!, interaction);
        }),
      new Button()
        .setCustomId('next')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.next)
        .setDisabled(!(this.pages.length > this.currentPage + 1))
        .run(async (interaction) => {
          await this.changePage(this.pages[++this.currentPage]!, interaction);
        }),
      new Button()
        .setCustomId('last')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(this.emojis.last)
        .setDisabled(this.currentPage + 1 === this.pages.length)
        .run(async (interaction) => {
          this.currentPage = this.pages.length - 1;
          await this.changePage(this.pages[this.currentPage]!, interaction);
        }),
    ]);

    return row;
  }

  getListener() {
    const componentsListener = new ComponentsListener({
      timeout: 60000,
      filter: (interaction) => {
        if (interaction.user.id !== this.context.author.id) {
          return interaction.write({
            content: this.context.t.commands.errors
              .noUserButton(interaction.user.tag)
              .get(),
            flags: MessageFlags.Ephemeral,
          });
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

  changePage(page: Embed, interaction: ButtonInteraction) {
    return interaction.update({
      embeds: [this.getEmbed(page)],
      components: this.getListener().addRows(this.getComponets()),
    });
  }

  getEmbed(embed: Embed) {
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
