import { createMiddleware } from 'seyfert';
import { MessageFlags } from 'seyfert/src/types';

export default createMiddleware<void>(async (middle) => {
  if (!middle.context.isChat()) return;
  await middle.context.interaction.deferReply(MessageFlags.Ephemeral);
  middle.next();
});
