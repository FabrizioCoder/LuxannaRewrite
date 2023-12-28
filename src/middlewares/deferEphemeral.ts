import { MessageFlags } from '@biscuitland/common';
import { createMiddleware } from '@potoland/core';

export default createMiddleware<void>((middle) => {
  middle.context.interaction.deferReply(MessageFlags.Ephemeral);
  middle.next();
});
