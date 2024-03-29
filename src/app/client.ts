import { Client, ParseClient, ParseLocales } from 'biscuitjs';
import { Ratelimit } from '../utils/constants';
import { AllMiddlewares } from '../middlewares/index';
import { ParseMiddlewares } from 'biscuitjs';
import { ActivityType, PresenceUpdateStatus } from 'biscuitjs/lib/common';
import mongoose from 'mongoose';
import 'dotenv/config';
import type defaultLang from '../locales/en-US.ts';

export async function main() {
  const client = new Client({
    presence(shardId) {
      return {
        activities: [
          {
            name: "the summoner's rift",
            type: ActivityType.Watching,
          },
        ],
        status: PresenceUpdateStatus.DoNotDisturb,
        shardId,
        afk: false,
        since: Date.now(),
      };
    },
  });

  client.events.OnFail = async (...err) => console.error('error', ...err);

  await client.start();
  client.setServices({
    defaultLang: 'en-US',
    middlewares: AllMiddlewares,
  });

  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: 'lux',
  });

  process.on('unhandledRejection', (reason, promise) => {
    client.logger.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (err) => {
    client.logger.fatal('Uncaught Exception thrown:', err);
  });

  const handleExit = async () => {
    if (client) {
      client.logger.info('Shutting down...');
      await client.gateway.disconnectAll();
      client.logger.info('Disconnected from gateway');
      process.exit();
    }
  };
  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
  process.on('SIGQUIT', handleExit);
}

declare module 'biscuitjs' {
  interface UsingClient extends ParseClient<Client<true>> {}
  interface DefaultLocale extends ParseLocales<typeof defaultLang> {}
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }

  interface Client {
    t(locale: string): ParseLocales<typeof defaultLang>;
  }

  interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof AllMiddlewares> {}
}
