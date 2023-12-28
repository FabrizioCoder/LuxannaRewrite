import { MessageFlags } from '@biscuitland/common';
import { createMiddleware } from '@potoland/core';

export default createMiddleware<void>((middle) => {
  middle.context.interaction.deferReply(
    middle.context.resolver.getHoisted('hide')?.value
      ? MessageFlags.Ephemeral
      : undefined
  );
  middle.next();
});
