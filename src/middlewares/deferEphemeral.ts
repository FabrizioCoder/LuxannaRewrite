import { MessageFlags } from '@biscuitland/common';
import { createMiddleware } from '@potoland/core';

export default createMiddleware<void>(async (middle) => {
  await middle.context.interaction.deferReply(MessageFlags.Ephemeral);
  middle.next();
});
