import { Client } from 'seyfert';
import { URL } from 'url';
import { userModel } from '../app/models/user';
import { Ratelimit } from './constants';
import { GuildEmoji, InteractionGuildMember, User } from 'seyfert/lib/structures';
import allemotes from '../../json/emojis.json';
import queues from '../../json/queues.json';
import champions from '../../json/champions.json';
import items from '../../json/items.json';

const spellIdToName = {
  21: 'Barrier',
  1: 'Cleanse',
  14: 'Ignite',
  3: 'Exhaust',
  4: 'Flash',
  6: 'Ghost',
  7: 'Heal',
  13: 'Clarity',
  30: 'ToTheKing',
  31: 'PoroToss',
  11: 'Smite',
  39: 'Mark',
  32: 'Mark',
  12: 'Teleport',
  54: 'Placeholder',
  55: 'Placeholder',
} as const;

function amount(entry: number) {
  return Intl.NumberFormat('en', { notation: 'compact' }).format(entry);
}

function calculateWinrate(wins: number, losses: number) {
  if (wins === 0 && losses === 0) return 0;
  return Math.round((wins / (wins + losses)) * 100);
}

function calculateCSPerMinute(cs: number, duration: number) {
  return Math.round((cs / duration) * 60);
}

function calculateKDA(kills: number, deaths: number, assists: number) {
  if (deaths === 0) return 'Perfect';
  return ((kills + assists) / deaths).toFixed(2);
}

function calculateKP(kills: number, assists: number, teamKills: number) {
  return (((kills + assists) / teamKills) * 100).toFixed(2);
}

function calculateGameDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
}

function capitalizeString(str: string) {
  const strLowerCase = str.toLowerCase();
  if (strLowerCase == null || strLowerCase.length <= 1) return strLowerCase;
  return strLowerCase.substring(0, 1).toUpperCase() + strLowerCase.substring(1);
}

function rawEmote(name: string): string | null {
  const flattenedEmotes = allemotes.flat();
  const emote = flattenedEmotes.find(
    (x: { name: string }) => x && x.name === name
  );

  return emote ? `${emote.name}:${emote.id}` : null;
}

const normalizedNames = {
  NunuWillump: 'Nunu',
  Kaisa: 'KaiSa',
  MonkeyKing: 'Wukong',
  Velkoz: 'VelKoz',
  Chogath: 'ChoGath',
  FiddleSticks: 'Fiddlesticks',
} as const;

function getEmojiData(_client: Client, name: string) {
  const normalized = name
    .replace(/\W/g, '')
    .replace(
      new RegExp(Object.keys(normalizedNames).join('|'), 'g'),
      (match) => normalizedNames[match as keyof typeof normalizedNames] ?? match
    );

  const allEmojis = <(GuildEmoji & { guild_id: string })[]><unknown>allemotes.flat();

  const emote = allEmojis.find((x) => x && x.name === normalized);

  return emote;
}

function championEmoji(name: string) {
  const correctedName = name.replace(
    /\W/g,
    (match) => normalizedNames[match as keyof typeof normalizedNames] ?? match
  );
  return getEmote(correctedName);
}

function getEmote(name: string) {
  const raw = rawEmote(name);

  return raw ? `<:${raw}>` : '';
}

function getChampionByName({
  name,
}: {
  name: string;
}): (typeof champions)[keyof typeof champions] | null {
  return champions[name as keyof typeof champions] ?? null;
}
/**
 * key: 266
 */
function getChampionByKey({ key }: { key: string }) {
  return Object.values(champions).find((x) => x.key === key);
}

/**
 *
 * @param id khazix
 * @example getChampionById('Khazix')
 */
function getChampionById(
  id: number | string
): (typeof champions)[keyof typeof champions] | null {
  return Object.values(champions).find((x) => x.id === id) ?? null;
}

function getQueueById(
  id: number | string
) {
  return queues.find((x) => x.id === id) ?? null;
}

function getSpellById(
  id: number
): (typeof spellIdToName)[keyof typeof spellIdToName] | null {
  return spellIdToName[id as keyof typeof spellIdToName] ?? null;
}

function getItemByName(name: string) {
  return Object.entries(items).find(([_, item]) => item.name === name);
}

const getParamFromUrl = (rawUrl: string, param: string): string | null => {
  if (rawUrl == null || param == null) return null;

  const parseObj = new URL(rawUrl);
  const params = parseObj.searchParams;
  return params.get(param);
};

const disallowedTags = [
  'script',
  'img',
  'a',
  'object',
  'iframe',
  'embed',
  'input',
  'textarea',
  'button',
  'link',
  'style',
  'base',
] as const;

const comments = /<!--[\s\S]*?-->/gi;
const xssLocator = /javascript:\/\*-->/gi;
const ecmaSet = /Set\.constructor`/gi;
const xml = /<\?xml/gi;
const cssUrlProperty = /url\s?\(.*?\)/gi;
const documentWrite = /document\.write/gi;

const datasrcAttribute = /(datasrc="?(.*?)"?)>/gi;
const useAttribute = /(use="?(.*?)"?)>/gi;
const srcAttribute = /(src="?(.*?)"?)>/gi;
const tags = /<\s?\/?\s?([a-z0-9]*)\b[^>]*\s?>?/gi;

const removeRules = new RegExp(
  `(${[comments, xssLocator, ecmaSet, xml, cssUrlProperty, documentWrite]
    .map(({ source }) => source)
    .join('|')})`,
  'gi'
);

function cleanHTML(input: string, __allowed = ' ') {
  if (!input) return '';
  const hasUnsafeTag = disallowedTags.some((tag) =>
    __allowed.includes(`<${tag}>`)
  );
  if (hasUnsafeTag) throw new Error(`Disallowed tags: ${__allowed}`);
  const allowed = (
    `${__allowed}`.toLowerCase().match(/<[a-z0-9]+>/g) || []
  ).join('');

  let output = input;
  output = output.replace(/<$/, '');

  while (true) {
    const current = output;
    output = current
      .replace(removeRules, '')
      .replace(datasrcAttribute, ($0, $1) => {
        return $0.replace($1, '');
      })
      .replace(srcAttribute, ($0, $1) => {
        return $0.replace($1, '');
      })
      .replace(useAttribute, ($0, $1) => {
        return $0.replace($1, '');
      })
      .replace(tags, (fullTag, tagName) => {
        return allowed.includes(`<${tagName.toLowerCase()}>`) ? fullTag : '';
      });

    if (current === output) return output;
  }
}

export const apiBaseURLs = {
  br: 'https://br1.api.riotgames.com',
  eune: 'https://eun1.api.riotgames.com',
  euw: 'https://euw1.api.riotgames.com',
  jp: 'https://jp1.api.riotgames.com',
  kr: 'https://kr.api.riotgames.com',
  lan: 'https://la1.api.riotgames.com',
  las: 'https://la2.api.riotgames.com',
  na: 'https://na1.api.riotgames.com',
  oce: 'https://oc1.api.riotgames.com',
  tr: 'https://tr1.api.riotgames.com',
  ru: 'https://ru.api.riotgames.com',
  pbe: 'https://na1.api.riotgames.com',
} as const;

export const regionalURLs = {
  na: 'https://americas.api.riotgames.com',
  pbe: 'https://americas.api.riotgames.com',
  br: 'https://americas.api.riotgames.com',
  lan: 'https://americas.api.riotgames.com',
  las: 'https://americas.api.riotgames.com',
  oce: 'https://sea.api.riotgames.com',
  kr: 'https://asia.api.riotgames.com',
  jp: 'https://asia.api.riotgames.com',
  eune: 'https://europe.api.riotgames.com',
  euw: 'https://europe.api.riotgames.com',
  tr: 'https://europe.api.riotgames.com',
  ru: 'https://europe.api.riotgames.com',
} as const;

function selectRegion<R extends keyof typeof regionalURLs>(
  region: R,
  regional: true
): (typeof regionalURLs)[R];
function selectRegion<R extends keyof typeof apiBaseURLs>(
  region: R,
  regional?: false
): (typeof apiBaseURLs)[R];
function selectRegion<
  R extends keyof typeof regionalURLs | keyof typeof apiBaseURLs
>(region: R, regional = false) {
  if (regional) {
    return regionalURLs[region as keyof typeof regionalURLs];
  }

  return apiBaseURLs[region as keyof typeof apiBaseURLs];
}

async function parseSummonerOptions({
  user,
  userId,
  riotId,
  region,
}: {
  user?: User | InteractionGuildMember;
  userId?: string;
  riotId?: string;
  region?: string;
}) {
  if (user) {
    const userDat = await userModel.findOne({ id: user.id });
    if (!userDat) return null;

    riotId ||= `${userDat.gameName}#${userDat.tagLine}`;
    region ||= userDat.region;
  }

  if (!riotId || !region) {
    const userDat = await userModel.findOne({ id: userId });
    if (!userDat) return null;

    riotId ||= `${userDat.gameName}#${userDat.tagLine}`;
    region ||= userDat.region;
  }

  if (!riotId || !region) return null;

  return { riotId, region };
}

function ApplyCooldown(data: Ratelimit) {
  return <T extends { new (...args: any[]): {} }>(target: T) =>
    class extends target {
      ratelimit = data;
    };
}

function makeIconURL(
  version: string,
  icon: number | undefined
): `https://ddragon.leagueoflegends.com/cdn/${string}/img/profileicon/${string}.png` {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${icon}.png`;
}
function makeChampionIconURL(
  version: string,
  id: string | undefined
): `https://ddragon.leagueoflegends.com/cdn/${string}/img/champion/${string}.png` {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`;
}

export {
  ApplyCooldown,
  calculateCSPerMinute,
  calculateGameDuration,
  calculateKDA,
  calculateKP,
  calculateWinrate,
  capitalizeString,
  championEmoji,
  cleanHTML,
  getItemByName,
  getChampionById,
  getChampionByKey,
  getChampionByName,
  getEmojiData,
  getEmote,
  getParamFromUrl,
  getQueueById,
  getSpellById,
  makeIconURL,
  makeChampionIconURL,
  parseSummonerOptions,
  rawEmote,
  selectRegion,
  amount,
};
