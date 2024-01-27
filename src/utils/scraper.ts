import { load } from 'cheerio';

async function getRunes(url: string): Promise<ResultRunes> {
  const response = await fetch(url);
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
    const shardIndex = i
      .split('<div style="position:relative" class')
      .slice(1)
      .findIndex((x) => !x.includes('grayscale'));
    const shard = i.split('alt="')[1]!.split('"')[0]!;

    result.perks.push({
      index: shardIndex,
      alt: shard,
    });
  }

  const runesWRElement = load(text)('td.css-1amolq6.edsne5b1').first();
  const runesWR = runesWRElement.text();
  result.wr = runesWR;

  return result;
}

async function getItems(url: string): Promise<ResultItems> {
  const response = await fetch(url);
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

    const buildWRElement = load(text)('td.css-1amolq6.edsne5b1').first();
    const buildWR = buildWRElement.text();
    result.coreBuild.wr = buildWR;
  }

  // Scrape Boots
  {
    const rawBootsText = text
      .split('class="css-1kswqo e12mb7fa0"')[2]!
      .split('<tbody>')[1]!
      .split('<tr>')[1]!;
    const $ = load(rawBootsText!);
    $('img').each((_, elem) => {
      const altText = $(elem).attr('alt');
      if (altText) {
        result.boots.name = altText;
      }
    });

    const bootsWRElement = load(text)('td.css-1amolq6.edsne5b1')
      .slice(15)
      .first();
    const bootsWR = bootsWRElement.text();
    result.boots.wr = bootsWR;
  }

  // Scrape Starter Items
  {
    const rawStarterItemsText = text
      .split('class="css-1kswqo e12mb7fa0"')[3]!
      .split('<tbody>')[1]!
      .split('<tr>')[1]!;

    const $ = load(rawStarterItemsText!);
    $('img').each((_, elem) => {
      const altText = $(elem).attr('alt');
      if (altText) {
        result.starterBuild.items.push(altText);
      }
    });

    const starterBuildWRElement = load(text)('td.css-1amolq6.edsne5b1')
      .slice(20)
      .first();
    const starterBuildWR = starterBuildWRElement.text();
    result.starterBuild.wr = starterBuildWR;
  }

  return result;
}

async function getSkillOrder(url: string): Promise<{
  keys: string[];
  wr: string;
}> {
  const response = await fetch(url);
  const text = await response.text();

  const rawSkillOrderText = text
    .split('<caption>Skills</caption>')[1]!
    .split('<tbody>')[1]!
    .split('<tr>')[1]!;
  const skillOrderText = rawSkillOrderText.split('<td ')[1]!.split('</td>')[0]!;
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

  const skillOrderWRElement = load(text)('td.css-1amolq6.edsne5b1').first();
  const skillOrderWR = skillOrderWRElement.text();
  result.wr = skillOrderWR;

  return result;
}

export async function getBuild(champion: string, role: string): Promise<Build> {
  const runes = await getRunes(
    `https://www.op.gg/champions/${champion}/runes/${role}`
  );
  const items = await getItems(
    `https://www.op.gg/champions/${champion}/items/${role}`
  );
  const skillOrder = await getSkillOrder(
    `https://www.op.gg/champions/${champion}/skills/${role}`
  );

  return {
    runes,
    items,
    skillOrder,
  };
}

interface Perks {
  index: number;
  alt: string;
}

interface ResultRunes {
  first: string[];
  second: string[];
  perks: Perks[];
  wr: string;
}

interface ResultItems {
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

interface Build {
  runes: ResultRunes;
  items: ResultItems;
  skillOrder: {
    keys: string[];
    wr: string;
  };
}
