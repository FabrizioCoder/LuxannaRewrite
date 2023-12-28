import { MessageFlags } from '@biscuitland/common';
import { createMiddleware } from '@potoland/core';

export default createMiddleware<void>(async (middle) => {
  await middle.context.interaction.deferReply(
    middle.context.resolver.getHoisted('hide')?.value
      ? MessageFlags.Ephemeral
      : undefined
  );
  middle.next();
});
