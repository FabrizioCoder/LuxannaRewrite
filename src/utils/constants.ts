import { ApplicationCommandOptionType } from '@biscuitland/common';
import { createOption, OKFunction, StopFunction } from '@potoland/core';

export enum LeagueRegion {
  BRAZIL = 'br',
  EUROPE_NORTHEAST = 'eune',
  EUROPE_WEST = 'euw',
  KOREA = 'kr',
  LATIN_AMERICA_NORTH = 'lan',
  LATIN_AMERICA_SOUTH = 'las',
  NORTH_AMERICA = 'na',
  OCEANIA = 'oce',
  RUSSIA = 'ru',
  TURKEY = 'tr',
  JAPAN = 'jp',
}

export enum EmbedColors {
  GREEN = 0x00ff00,
  PURPLE = 0x6002ee,
  RED = 0xff0000,
  YELLOW = 0xffec00,
  CYAN = 0x00deff,
  BLACK = 0x000000,
  WHITE = 0xffffff,
  BLUE = 0x2564f4,
}

export const RegionChoices = Object.entries(LeagueRegion).map((region) => ({
  name: region[0]
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase()),
  value: region[1],
  type: ApplicationCommandOptionType.String,
}));

export const hide = createOption({
  type: ApplicationCommandOptionType.Boolean,
  description: 'Hide command output',
  value: (value: boolean, ok) => {
    ok(value);
  },
  required: false,
});

export const searchOptions = {
  user: createOption({
    description:
      'When searching for an account linked to a user, the user is required.',
    description_localizations: {
      'es-ES':
        'Cuando buscas una cuenta vinculada a un usuario, el usuario es requerido.',
    },
    required: false,
    type: 6,
  }),
  'riot-id': createOption({
    description:
      'When searching for a specific player, the RiotId is required.',
    description_localizations: {
      'es-ES': 'Cuando buscas un jugador específico, el RiotId es requerido.',
    },
    required: false,
    type: 3,
    value(value: string, ok: OKFunction<string>, fail: StopFunction) {
      if (!value.includes('#'))
        fail(Error('The RiotId must include the "#". (FabrizioCoder#6030)'));
      ok(value);
    },
  }),
  region: createOption({
    description:
      'When searching for a specific player, the region in which he plays is required.',
    description_localizations: {
      'es-ES':
        'Cuando buscas un jugador específico, la región en la que juega es requerida.',
    },
    required: false,
    type: ApplicationCommandOptionType.String,
    choices: RegionChoices,
    value(value: string, ok: OKFunction<string>) {
      ok(value);
    },
  }),
};

export interface Ratelimit {
  type: 'user' | 'channel';
  time: number;
}

export interface CooldownUser {
  data: Ratelimit;
  executedAt: number;
}

export interface CooldownChannel {
  data: Ratelimit;
  executedAt: number;
}
