import { Client, ParseClient, ParseLocales, ParseMiddlewares } from 'seyfert';
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types';
import { Ratelimit } from '../utils/constants';
import { AllMiddlewares } from '../middlewares/index';
import mongoose from 'mongoose';
import 'dotenv/config';
import type defaultLang from '../locales/en-US.ts';

export async function main() {
  const client = new Client({
    presence(_) {
      return {
        activities: [
          {
            name: "the summoner's rift",
            type: ActivityType.Playing,
          },
        ],
        status: PresenceUpdateStatus.DoNotDisturb,
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
    cache: {
      disabledCache: ['channels', 'members', 'roles', 'emojis', 'messages', 'users'],
    }
  });

  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: 'lux',
  });

  async function data() {
    return await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  }

  let versions = await data();
  setInterval(async () => {
    versions = await data();
  }, 1000 * 60 * 60);

  client.version = (await versions.json())[0] as string || '14.13.1';

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

  interface Client {
    /**
     * The current version of the game
     */
    version: string;
  }

  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }

  interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof AllMiddlewares> {}
}
