import { Command, CommandContext, Declare, Middlewares } from 'biscuitjs';
import { ApplyCooldown } from '../utils/functions';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Attachment } from 'biscuitjs/lib/builders';

@Declare({
  name: 'help',
  description: 'Get all my commands',
})
@Middlewares(['DeferReply', 'Cooldown'])
@ApplyCooldown({
  time: 5000,
  type: 'user',
})
export default class HelpCommand extends Command {
  async run(ctx: CommandContext<'client'>) {
    const image = await readFile(
      join(__dirname, '../../assets/help/LuxannaCommands.png')
    );

    return ctx.editOrReply({
      content: 'Here are all my commands!',
      files: [
        new Attachment()
          .setFile('buffer', image)
          .setName('LuxannaCommands.png')
          .setDescription('Luxanna Commands'),
      ],
    });
  }
}
