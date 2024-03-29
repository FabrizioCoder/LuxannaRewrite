import { MessageFlags } from 'biscuitjs/lib/common';
import { createMiddleware } from 'biscuitjs';

export default createMiddleware<void>(async (middle) => {
  await middle.context.interaction.deferReply(MessageFlags.Ephemeral);
  middle.next();
});
