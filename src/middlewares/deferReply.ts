import { MessageFlags } from 'seyfert/lib/types';
import { createMiddleware } from 'seyfert';

export default createMiddleware<void>(async (middle) => {
  if (!middle.context.isChat()) return;
  await middle.context.interaction.deferReply(
    middle.context.resolver.getHoisted('hide')?.value
      ? MessageFlags.Ephemeral
      : undefined
  );
  middle.next();
});
