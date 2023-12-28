import { PotoClient as Client } from '@potoland/core';
import mongoose from 'mongoose';
import { Ratelimit } from '../utils/constants';

export async function main() {
  const client = new Client();

  client.events.OnFail = async (...err) => console.error('error', ...err);
  client.setServices({
    defaultLang: 'en-US',
  });

  await client.start();

  await mongoose.connect(process.env.MONGO_URI!);
}

declare module '@potoland/core' {
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }
}
