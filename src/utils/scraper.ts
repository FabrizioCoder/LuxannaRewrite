import { load } from 'cheerio';
import { cleanHTML } from './functions';

async function getRunes(url: string): Promise<ResultRunes | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();

    const rawRunesText = text
      .split('<caption>Runes</caption>')[1]!
      .split('<tbody>')[1]!;
    const runesText = rawRunesText
      .split('<tr>')[1]!
      .split('</tr>')[0]!
      .split('<td ')[1]!
      .split('</td>')[0]!;
    const runes = runesText.split('<div class="divider"');

    const result: ResultRunes = {
      first: [],
      second: [],
      perks: [],
      wr: '0%',
    };

    for (const i of runes[0]!.split('<div class="row">').slice(1)) {
      const rune =
        i.split('css-19js88b e1y8mv8s1">')[1] ||
        i.split('css-1k1cq3m e1y8mv8s1">')[1] ||
        i.split('<div class="item item_mark">')[1];

      if (rune) {
        const name = rune.split('alt="')[1]!.split('"')[0]!;
        result.first.push(name);
      }
    }

    for (const i of runes[1]!.split('<div class="row">').slice(1)) {
      const rune =
        i.split('css-1k1cq3m e1y8mv8s1">')[1] ||
        i.split('class="item item_mark">')[1];

      if (rune) {
        const name = rune.split('alt="')[1]!.split('"')[0]!;
        result.second.push(name);
      }
    }

    for (const i of runes[2]!.split('<div class="row">').slice(1)) {
      const shardsSrc = i
        .split('<div style="position:relative" class')
        .slice(1)
        .filter((x) => !x.includes('grayscale'));
      for (const shard of shardsSrc) {
        const shardId = shard.split('perkShard/')[1]!.split('.png')[0]!;
        result.perks.push(shardId);
      }
    }

    const runesWRElement = load(text)('td.css-1amolq6.eyczova1').first();
    const runesWR = runesWRElement.text();
    result.wr = runesWR;

    return result;
  } catch (error) {
    return null;
  }
}

async function getItems(url: string): Promise<ResultItems | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();

    const result: ResultItems = {
      starterBuild: {
        items: [],
        wr: '0%',
      },
      coreBuild: {
        items: [],
        wr: '0%',
      },
      boots: {
        name: '',
        wr: '0%',
      },
    };

    const rawItemsText = text
      .split('<caption>Items page pick rate, win rate</caption>')[1]!
      .split('<tbody>')[1]!;
    const coreItemsText = rawItemsText.split('<tr>')[1]!;
    const coreItems = coreItemsText.split('<div class="divider"')[0];

    // Scrape Core Items
    {
      const $ = load(coreItems!);
      $('img').each((_, elem) => {
        const altText = $(elem).attr('alt');
        if (altText) {
          result.coreBuild.items.push(altText);
        }
      });

      const buildWRElement = load(text)('td.css-1amolq6.eyczova1').first();
      const buildWR = buildWRElement.text();
      result.coreBuild.wr = buildWR;
    }

    // Scrape Boots
    {
      const rawBootsText = text
        .split('class="css-1q0r7l3 e12mb7fa0"')[2]!
        .split('<tbody>')[1]!
        .split('<tr>')[1]!;
      const $ = load(rawBootsText!);
      $('img').each((_, elem) => {
        const altText = $(elem).attr('alt');
        if (altText) {
          result.boots.name = altText;
        }
      });

      const bootsWRElement = load(text)('td.css-1amolq6.eyczova1')
        .slice(15)
        .first();
      const bootsWR = bootsWRElement.text();
      result.boots.wr = bootsWR;
    }

    // Scrape Starter Items
    {
      const rawStarterItemsText = text
        .split('class="css-4twzwo e8p0atj0"')[3]!
        .split('<tbody>')[1]!
        .split('<tr>')[1]!;

      const $ = load(rawStarterItemsText!);
      $('img').each((_, elem) => {
        const altText = $(elem).attr('alt');
        if (altText) {
          result.starterBuild.items.push(altText);
        }
      });

      const starterBuildWRElement = load(text)('td.css-1amolq6.eyczova1')
        .slice(20)
        .first();
      const starterBuildWR = starterBuildWRElement.text();
      result.starterBuild.wr = starterBuildWR;
    }

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getSkillOrder(url: string): Promise<{
  keys: string[];
  wr: string;
} | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();

    const rawSkillOrderText = text
      .split('<caption>Skills</caption>')[1]!
      .split('<tbody>')[1]!
      .split('<tr>')[1]!;
    const skillOrderText = rawSkillOrderText
      .split('<td ')[1]!
      .split('</td>')[0]!;
    const skillOrder = skillOrderText.split('<div class="divider"');

    const result: {
      keys: string[];
      wr: string;
    } = {
      keys: [],
      wr: '0%',
    };
    const $ = load(skillOrder[0]!);
    $('strong').each((_, elem) => {
      const skill = $(elem).text();
      result.keys.push(skill);
    });

    const skillOrderWRElement = load(text)('td.css-1amolq6.eyczova1').first();
    const skillOrderWR = skillOrderWRElement.text();
    result.wr = skillOrderWR;

    return result;
  } catch (error) {
    return null;
  }
}

export async function getPatchNotes(): Promise<{
  title: string;
  imageUrl: string;
  url: string;
  text: string;
} | null> {
  try {
    const url =
      'https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-3-notes/';
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    
    const title = load(text)('title').text();
    const $ = load(text);
    const patchNotesText = $('.white-stone.accent-before')
      .slice(2)
      .first()
      .text();
    const imageUrl = $('a.skins.cboxElement').attr('href')!;
    return {
      title,
      imageUrl,
      url,
      text: cleanHTML(patchNotesText).replaceAll('\t', '').trim(),
    };
  } catch (error) {
    return null;
  }
}

export async function getBuild(champion: string, role: string): Promise<Build> {
  const baseUrl = `https://www.op.gg/champions/${champion}`;
  const [runes, items, skillOrder] = (await Promise.all([
    getRunes(`${baseUrl}/runes/${role}?region=kr`),
    getItems(`${baseUrl}/items/${role}?region=kr`),
    getSkillOrder(`${baseUrl}/skills/${role}?region=kr`),
  ])) ?? [null, null, null];

  return {
    runes,
    items,
    skillOrder,
    baseUrl: `${baseUrl}/build/${role}?region=kr`,
  };
}

export interface ResultRunes {
  first: string[];
  second: string[];
  perks: string[];
  wr: string;
}

export interface ResultItems {
  starterBuild: {
    items: string[];
    wr: string;
  };
  coreBuild: {
    items: string[];
    wr: string;
  };
  boots: {
    name: string;
    wr: string;
  };
}

export interface Build {
  runes: ResultRunes | null;
  items: ResultItems | null;
  skillOrder: {
    keys: string[];
    wr: string;
  } | null;
  baseUrl: string;
}
