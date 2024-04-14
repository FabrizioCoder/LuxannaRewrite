import { createMiddleware } from 'seyfert';

export const devs = [
  '221399196480045056',
  '507367752391196682',
  '576805413148688424',
];

export default createMiddleware<void>((middle) => {
  if (!middle.context.isChat()) return;
  if (!devs.includes(middle.context.author.id)) {
    middle.context.editOrReply({
      content: '⚠️ Solo gli sviluppatori possono usare questo comando.',
      flags: 64,
    });
    middle.stop('tu no eri dev');
  }

  middle.next();
});
