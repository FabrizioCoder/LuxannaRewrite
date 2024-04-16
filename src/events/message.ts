import { createEvent } from 'seyfert';
import { devs } from '../middlewares/onlyDev';
import { inspect } from 'util';
export default createEvent({
  data: { once: false, name: 'messageCreate' },
  async run(message, client) {
    const commandRegex = new RegExp(`^<@!?${client.botId}> eval`);
    if (commandRegex.test(message.content)) {
      if (!devs.includes(message.author.id)) return;
      const args = message.content.trim().split(/\s/).slice(2);
      if (!args.length)
        return message.reply({
          content: '⚠️ Solo gli sviluppatori possono usare questo comando.',
          allowed_mentions: { replied_user: false, roles: [], users: [] },
        });
      try {
        const codeResponse = await eval(args.join(' '));
        await message.reply({
          content: `\`\`\`js\n${String(
            inspect(codeResponse, {
              depth: 0,
            })
          ).slice(0, 1800)}\`\`\``,
        });
      } catch (err) {
        await message.reply({ content: `\`\`\`xl\n${err}\`\`\`` });
      }
      return message.react('✅');
    }
  },
});
