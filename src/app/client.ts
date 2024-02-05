import { Client, IClients, OptionsRecord, ParseLocales } from 'biscuitjs';
import { Ratelimit } from '../utils/constants';
import mongoose from 'mongoose';
import 'dotenv/config';
import type defaultLang from '../locales/en-US.ts';
import { AllMiddlewares } from '../middlewares/index';

import {
  MessageCommandInteraction,
  UserCommandInteraction,
} from 'biscuitjs/lib/structures/Interaction';
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
  interface Command {
    ratelimit: Ratelimit;
  }
  interface SubCommand {
    ratelimit: Ratelimit;
  }

  interface CommandContext<
    C extends keyof IClients,
    T extends OptionsRecord = {},
    M extends readonly (keyof RegisteredMiddlewares)[] = []
  > {
    t: ParseLocales<typeof defaultLang>;
  }

  interface MenuCommandContext<
    C extends keyof IClients,
    T extends
      | UserCommandInteraction<boolean>
      | MessageCommandInteraction<boolean>,
    M extends readonly (keyof RegisteredMiddlewares)[] = []
  > {
    t: ParseLocales<typeof defaultLang>;
  }

  interface Client {
    t(locale: string): ParseLocales<typeof defaultLang>;
  }

  interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof AllMiddlewares> {}
}
