import { Client, ParseClient, ParseLocales, ParseMiddlewares } from 'seyfert';
import { ActivityType, PresenceUpdateStatus } from 'seyfert/src/types';
import { Ratelimit } from '../utils/constants';
import { AllMiddlewares } from '../middlewares/index';
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
            type: ActivityType.Playing,
          },
        ],
        status: PresenceUpdateStatus.Invisible,
        afk: false,
        since: Date.now(),
      };
    },
  })!;

  client.events!.onFail = async (...err) => console.error('error', ...err);

  await client.start();
  client.setServices({
    langs: {
      default: 'en-US',
    },
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

declare module 'seyfert' {
  interface UsingClient extends ParseClient<Client<true>> {}
  interface DefaultLocale extends ParseLocales<typeof defaultLang> {}
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }

  interface BaseClient {
    t(locale: string): ParseLocales<typeof defaultLang>;
  }

  interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof AllMiddlewares> {}
}
