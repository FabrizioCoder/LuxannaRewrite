import { PotoClient as Client } from '@potoland/core';
import { Ratelimit } from '../utils/constants';
import { Redis } from 'ioredis';
import { LuxannaStore } from './cache';
import mongoose from 'mongoose';
require('dotenv/config');

export async function main() {
  const client = new Client();

  const adapter = new Redis(process.env.REDIS_URL!);

  adapter.on('ready', () => client.logger.info('Redis ready'));
  adapter.on('error', (err) => console.error('redis error', err));

  client.events.OnFail = async (...err) => console.error('error', ...err);
  client.setServices({
    defaultLang: 'en-US',
  });
  client.store = new LuxannaStore(adapter);

  await client.start();

  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: 'lux',
  });
}

declare module '@potoland/core' {
  interface PotoClient {
    store: LuxannaStore;
  }
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }
}
