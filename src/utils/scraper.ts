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
      champion: {
        wr: '0%',
        pickRate: '0%',
        banRate: '0%',
      },
    };

    const $ = load(text);
    $('div.css-1bzqlwn.e1y855lo1').each((_, elem) => {
      const rateLabel = $(elem).find('div.css-brbf14.e1y855lo2').text().trim();
      const rateValue = $(elem).find('div.css-oxevym.e1y855lo3').text().trim();

      if (rateLabel === 'Win rate') {
        result.champion.wr = rateValue;
      } else if (rateLabel === 'Pick rate') {
        result.champion.pickRate = rateValue;
      } else if (rateLabel === 'Ban rate') {
        result.champion.banRate = rateValue;
      }
    });

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
    const coreItems = coreItemsText.split('<div class=""')[0];

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
        .split('class="css-1q0r7l3 e1h3twa80"')[2]!
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
        .split('class="css-1q0r7l3 e1h3twa80"')[3]!
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
    const r = await fetch(
      'https://ddragon.leagueoflegends.com/api/versions.json'
    );
    if (!r.ok) return null;
    const versions = await r.json();
    const latestVersion = versions[0].split('.').slice(0, 2).join('-');

    let url = `https://www.leagueoflegends.com/en-us/news/game-updates/patch-${latestVersion}-notes/`;

    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      url = `https://www.leagueoflegends.com/en-us/news/game-updates/lol-patch-${latestVersion}-notes/`;
    }
    response = await fetch(url);

    if (!response.ok) return null;
    
    const text = await response.text();

    const title = load(text)('title').text();
    const $ = load(text);
    const patchNotesText = $('.white-stone.accent-before')
      .slice(0)
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
  champion: {
    wr: string;
    pickRate: string;
    banRate: string;
  };
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
