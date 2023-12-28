import { ApplicationCommandOptionType } from '@biscuitland/common';
import { createOption, OKFunction, StopFunction } from '@potoland/core';
import { Image } from 'imagescript';

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

export const HextechColors = {
  BLUE1: 0xcdfafaff,
  BLUE2: 0x0ac8b9ff,
  BLUE3: 0x0397abff,
  BLUE4: 0x005a82ff,
  BLUE5: 0x0a323cff,
  BLUE6: 0x091428ff,
  BLUE7: 0x0a1428ff,
  GOLD1: 0xf0e6d2ff,
  GOLD2: 0xc8aa6eff,
  GOLD3: 0xc8aa6eff,
  GOLD4: 0xc89b3cff,
  GOLD5: 0x785a28ff,
  GOLD6: 0x463714ff,
  GOLD7: 0x32281eff,
  GREY1: 0xa09b8cff,
  GREY2: 0x3c3c41ff,
  GREY3: 0x1e2328ff,
  GREY4: 0x1e282dff,
  BLACK: 0x010a13ff,
} as const;

export const gardients = {
  DarkBlue: Image.gradient({
    0: HextechColors.BLUE6,
    1: HextechColors.BLUE7,
  }),
  Gold: Image.gradient({
    0: HextechColors.GOLD5,
    1: HextechColors.GOLD4,
  }),
  Blue: Image.gradient({
    0: HextechColors.BLUE4,
    1: HextechColors.BLUE2,
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
