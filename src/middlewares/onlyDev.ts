import { createMiddleware } from '@potoland/core';

const devs = ['221399196480045056'];

export default createMiddleware<void>((middle) => {
  if (!devs.includes(middle.context.author.id))
    middle.stop(new Error("tu no eri dev"));
  
  middle.next();
});
