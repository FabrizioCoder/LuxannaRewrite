import {
  AttachmentBuilder,
  CommandContext,
  Declare,
  SubCommand,
} from 'seyfert';
import { ApplyCooldown } from '../../utils/functions';
import { getPatchNotes } from '../../utils/scraper';
import { EmbedColors } from '../../utils/constants';

@Declare({
  name: 'patchnotes',
  description: 'Get the latest patch notes for League of Legends.',
})
@ApplyCooldown({
  time: 10000,
  type: 'user',
})
export default class PatchNotesCommand extends SubCommand {
  async run(ctx: CommandContext) {
    const patch = await getPatchNotes();
    if (!patch)
      return ctx.editOrReply({
        content: '⚠️ No patch notes found for the current patch.',
      });

    return ctx.editOrReply({
      files: [
        new AttachmentBuilder()
          .setFile('url', patch.imageUrl)
          .setName('patchnotes.png'),
      ],
      embeds: [
        {
          title: `Patch Highlights`,
          description: patch.text,
          color: EmbedColors.BLUE,
          image: {
            url: 'attachment://patchnotes.png',
          },
          author: {
            name: patch.title,
            icon_url: 'https://i.imgur.com/5xyKHrP.png',
            url: patch.url,
          },
        },
      ],
    });
  }
}
