import { Client, RedisAdapter } from 'biscuitjs';
import { Ratelimit } from '../utils/constants';
import mongoose from 'mongoose';
import 'dotenv/config';

export async function main() {
  const client = new Client();

  client.events.OnFail = async (...err) => console.error('error', ...err);

  await client.start();
  client.setServices({
    cache: {
      adapter: new RedisAdapter({
        redisOptions: {
          host: 'us1-special-buffalo-38283.upstash.io',
          port: 38283,
          password: 'eda62d2d2974486883fb4a9862ea2308',
          tls: {},
        },
        namespace: 'lux',
      }),
      disabledCache: ['channels', 'presences', 'roles', 'stickers'],
    },
  });

  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: 'lux',
  });
}

declare module 'biscuitjs' {
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }
}
