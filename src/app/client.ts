import {
  Client,
  ParseClient,
  ParseLocales,
} from 'biscuitjs';
import { Ratelimit } from '../utils/constants';
import mongoose from 'mongoose';
import 'dotenv/config';
import type defaultLang from '../locales/en-US.ts';
import { AllMiddlewares } from '../middlewares/index';
import { ParseMiddlewares } from 'biscuitjs';
import { ActivityType, PresenceUpdateStatus } from '@biscuitland/common';

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
