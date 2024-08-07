import { readFile } from 'fs/promises';
import { Image } from 'imagescript';
import { join } from 'path';
import { default as Augments } from '../../../json/augments.json';
import { default as Perks } from '../../../json/perks.json';
import * as SummonerSpells from '../../../json/summoners.json';
import { SummonerMatches } from '../../app/structures/match';
import { Summoner } from '../../app/structures/summoner';
import sharp from 'sharp';
import { CommandContext } from 'seyfert';
import { getQueueById } from '../functions';

const paths = {
  background: join(process.cwd(), 'assets', 'history', 'background.png'),
} as const;

async function getIcon(_version: string, champion: string, size = 120) {
  const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champion}.png`;
  //   `https://prod.api.assets.riotgames.com/public/v1/asset/lol/${version}/CHAMPION/${
  //     Object.values(Champions).find((x) => x.key === champion)?.key
  //   }/ICON?width=${size}&height=${size}&auto=png`;
  const x_1 = await fetch(url);
  const x_2 = await (x_1.arrayBuffer() as Promise<Buffer>);
  return await Image.decode(await sharp(x_2).resize(size, size).toBuffer());
}

async function getSpell(version: string, spell: string, size = 44) {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${
    Object.values(SummonerSpells).find((x) => x.key === spell)?.id
  }.png`;
  const x_1 = await fetch(url);
  const x_2 = await (x_1.arrayBuffer() as Promise<Buffer>);

  return await Image.decode(await sharp(x_2).resize(size, size).toBuffer());
}

async function getItem(version: string, item: number) {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`;
  const x = await fetch(url);
  const x_1 = await (x.arrayBuffer() as Promise<Buffer>);

  return await Image.decode(await sharp(x_1).resize(44, 44).toBuffer());
}

async function getAugment(augment: number) {
  const baseURL =
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';
  const perkJson = Augments.find((x) => x.id === augment);
  if (!perkJson) {
    // console.log(augment)
    return new Image(44, 44);
  }
  const url = `${baseURL}/${perkJson?.augmentSmallIconPath
    .split('assets')[1]
    ?.toLowerCase()
    .replace('.arena_augments_v2', '')}`;

  const x_1 = await fetch(url);
  const x_2 = await (x_1.arrayBuffer() as Promise<Buffer>);

  return await Image.decode(await sharp(x_2).resize(44, 44).toBuffer());
}

async function getPerk(perk: number, isSecondary = false, size = 50) {
  const baseURL =
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';
  const perkJson = Perks.find((x) => x.id === perk);
  if (!perkJson) {
    // console.log(perk)
    return new Image(size, size);
  }
  const url = `${baseURL}/v1${perkJson?.iconPath
    .split('v1')[1]
    ?.toLowerCase()}`;
  if (isSecondary) {
  }

  const x_1 = await fetch(url);
  const x_2 = await (x_1.arrayBuffer() as Promise<Buffer>);
  return await Image.decode(await sharp(x_2).resize(size, size).toBuffer());
}

async function makeKDA(
  kills: number,
  deaths: number,
  assists: number,
  font: Buffer,
  scale = 24
) {
  const slashImage = await Image.renderText(
    font,
    scale - 2,
    ' /  ',
    0x3d4f72ff
  );
  const killsImage = await Image.renderText(font, scale, `${kills}`);
  const deathsImage = await Image.renderText(
    font,
    scale,
    `${deaths}`,
    0xeb3349ff
  );
  const assistsImage = await Image.renderText(font, scale, `${assists}`);

  const canvas = new Image(
    killsImage.width +
      assistsImage.width +
      deathsImage.width +
      slashImage.width * 2,
    Math.max(killsImage.height, deathsImage.height, assistsImage.height)
  );

  canvas.composite(killsImage);
  canvas.composite(
    slashImage,
    killsImage.width,
    canvas.height / 2 - slashImage.height / 2
  );
  canvas.composite(deathsImage, killsImage.width + slashImage.width);
  canvas.composite(
    slashImage,
    killsImage.width + deathsImage.width + slashImage.width,
    canvas.height / 2 - slashImage.height / 2
  );
  canvas.composite(
    assistsImage,
    killsImage.width + deathsImage.width + slashImage.width * 2
  );

  return canvas;
}

async function makeLabel(
  match: NonNullable<Awaited<ReturnType<SummonerMatches['fetchById']>>>,
  summoner: Summoner,
  boldFont: Buffer,
  ctx: CommandContext
) {
  const canvas = new Image(600, 190);
  // canvas.fill((x, y) => Gradients.DarkBlue((x + y) / (canvas.width + canvas.height)));

  const participant = match.info.participants.find(
    (x) => x.puuid === summoner.puuid
  )!;
  const icon = (
    await getIcon(ctx.client.version, participant.championId.toString(), 91)
  ).roundCorners(16);

  // console.log(match.info.gameMode)

  switch (match.info.gameMode) {
    case 'CHERRY':
      {
        const places = ['st', 'nd', 'rd', 'th'];
        const subteamPlacement = await Image.renderText(
          boldFont,
          16,
          participant.subteamPlacement!.toString() +
            (places[participant.subteamPlacement! - 1] || 'th')
        );

        canvas.composite(
          subteamPlacement,
          336 - subteamPlacement.width / 2,
          62
        );
        const augments = [
          participant.playerAugment1,
          participant.playerAugment2,
          participant.playerAugment3,
          participant.playerAugment4,
        ].filter((x) => x !== undefined) as number[];
        const augmentsIcons = await Promise.all(
          augments.map((x) => getAugment(x))
        );

        for (let i = 0; i < augmentsIcons.length; i++) {
          const perk = augmentsIcons[i]!;
          canvas.composite(perk, i < 2 ? 251 : 375, (i % 2) * 50);
        }
      }
      break;
    default:
      {
        const spells = await Promise.all(
          [participant.summoner1Id, participant.summoner2Id].map((x) =>
            getSpell(ctx.client.version, x.toString(), 40)
          )
        );

        // for (let i = 0; i < spells.length; i++) {
        //     const spell = spells[i]!
        //     canvas.composite(spell, 300, i * 50)
        // }
        const [primary, secondary] = participant.perks.styles;

        const primaryRune = primary!.selections[0]!;
        const secondaryRune = secondary!.selections[0]!;

        const perks = await Promise.all([
          getPerk(primaryRune.perk, false, 40),
          getPerk(secondaryRune.perk, true, 40),
        ]);
        // for (let i = 0; i < perks.length; i++) {
        //     const perk = perks[i]!
        //     canvas.composite(perk, 350, i * 50)
        // }
        const images = [...spells, ...perks];
        for (let i = 0; i < 4; i++) {
          const image = images[i]!.cropCircle();
          canvas.composite(image, i < 2 ? 254 : 375, (i % 2) * 50);
        }
        const visionScore = await Image.renderText(
          boldFont,
          16,
          participant.visionScore!.toString()
        );
        canvas.composite(visionScore, 336 - visionScore.width / 2, 62);
      }
      break;
  }

  const ward = participant.item6
    ? (await getItem(ctx.client.version, participant.item6)).roundCorners(6)
    : null;
  if (ward) canvas.composite(ward, 311, 10);

  const gameQueue = getQueueById(match.info.queueId) || null;
  const gameMode = await Image.renderText(
    boldFont,
    20,
    gameQueue
      ? gameQueue.description || match.info.gameMode
      : match.info.gameMode
  );
  canvas.composite(gameMode, 85 - gameMode.width / 2);

  const winOrDefeat = await Image.renderText(
    boldFont,
    18,
    participant.teamEarlySurrendered
      ? 'REDO'
      : participant.win
      ? 'WIN'
      : 'LOSE',
    participant.win ? 0x93f9b9ff : 0xeb3349ff
  );
  canvas.composite(winOrDefeat, 55 - winOrDefeat.width / 2, 26);

  const kdaText = await makeKDA(
    participant.kills,
    participant.deaths,
    participant.assists,
    boldFont,
    15
  );
  canvas.composite(kdaText, 55 - kdaText.width / 2, 50);

  const kdaScore = await Image.renderText(
    boldFont,
    15,
    (
      (participant.kills + participant.assists) /
      (participant.deaths || 1)
    ).toFixed(1),
    0xfabe4fff
  );
  canvas.composite(kdaScore, 122 - kdaScore.width / 2, 50);

  const time = await Image.renderText(
    boldFont,
    18,
    numberToTimestamp(match.info.gameDuration),
    0xaab7d1ff
  );
  canvas.composite(time, 122 - time.width / 2, 26);
  const totalCS =
    participant.totalMinionsKilled + participant.neutralMinionsKilled;

  const csScore = await Image.renderText(
    boldFont,
    18,
    `${totalCS} CS (${(totalCS / (match.info.gameDuration / 60)).toFixed(1)})`,
    0xacbee0ff
  );
  canvas.composite(csScore, 85 - csScore.width / 2, 71);

  canvas.composite(icon, 155);
  return canvas;
}

export async function makeMatchHistory(
  matches: NonNullable<Awaited<ReturnType<SummonerMatches['fetchById']>>>[],
  summoner: Summoner,
  ctx: CommandContext
) {
  const canvas = await Image.decode(await readFile(paths.background));
  const boldFont = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'history', 'KumbhSans-Bold.ttf')
  );

  const firstMatch = matches[0]!;
  const participant = firstMatch.info.participants.find(
    (x) => x.puuid === summoner.puuid
  )!;
  const icon = await getIcon(
    ctx.client.version,
    participant.championId.toString()
  );

  const gameQueue = getQueueById(firstMatch.info.queueId) || null;
  const gameMode = await Image.renderText(
    boldFont,
    26,
    gameQueue
      ? gameQueue.description || firstMatch.info.gameMode
      : firstMatch.info.gameMode
  );
  canvas.composite(gameMode, 96 - gameMode.width / 2, 34);

  const winOrDefeat = await Image.renderText(
    boldFont,
    22,
    participant.teamEarlySurrendered
      ? 'REDO'
      : participant.win
      ? 'WIN'
      : 'LOSE',
    participant.win ? 0x93f9b9ff : 0xeb3349ff
  );
  canvas.composite(winOrDefeat, 85 - winOrDefeat.width, 83);

  const time = await Image.renderText(
    boldFont,
    18,
    numberToTimestamp(firstMatch.info.gameDuration),
    0xaab7d1ff
  );
  canvas.composite(time, 128 - time.width / 2, 86);

  switch (firstMatch.info.gameMode) {
    case 'CHERRY':
      {
        const augments = [
          participant.playerAugment1,
          participant.playerAugment2,
          participant.playerAugment3,
          participant.playerAugment4,
        ].filter((x) => x !== undefined) as number[];
        const augmentsIcons = await Promise.all(
          augments.map((x) => getAugment(x))
        );

        for (let i = 0; i < augmentsIcons.length; i++) {
          const perk = augmentsIcons[i]!;
          canvas.composite(perk, 365 + (i > 1 ? 56 : 0), (i % 2) * 58 + 27);
        }

        const places = ['st', 'nd', 'rd', 'th'];
        const subteamPlacement = await Image.renderText(
          boldFont,
          16,
          participant.subteamPlacement!.toString() +
            (places[participant.subteamPlacement! - 1] || 'th')
        );

        canvas.composite(
          subteamPlacement,
          694 - subteamPlacement.width / 2,
          95
        );
      }
      break;
    default:
      {
        const spells = await Promise.all(
          [participant.summoner1Id, participant.summoner2Id].map((x) =>
            getSpell(ctx.client.version, x.toString())
          )
        );

        for (let i = 0; i < spells.length; i++) {
          const spell = spells[i]!;
          canvas.composite(spell.cropCircle(), 353, i * 58 + 27);
        }

        const [primary, secondary] = participant.perks.styles;

        const primaryRune = primary!.selections[0]!;
        const secondaryRune = secondary!.selections[0]!;

        const perks = await Promise.all([
          getPerk(primaryRune.perk),
          getPerk(secondaryRune.perk, true),
        ]);
        for (let i = 0; i < perks.length; i++) {
          const perk = perks[i]!;
          canvas.composite(perk, 422, i * 58 + 27);
        }

        const visionScore = await Image.renderText(
          boldFont,
          16,
          participant.visionScore!.toString()
        );
        canvas.composite(visionScore, 694 - visionScore.width / 2, 95);
      }
      break;
  }
  const build = [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
  ].filter((x) => x);

  for (let i = 0; i < build.length; i++) {
    const item = build[i]!;
    const icon = await getItem(ctx.client.version, item);

    const x = i % 3;
    const y = Math.floor(i / 3);

    canvas.composite(icon, 501 + 56 * x, 24 + y * 58);
  }

  const ward = participant.item6
    ? (await getItem(ctx.client.version, participant.item6)).roundCorners(6)
    : null;
  if (ward) canvas.composite(ward, 669, 42);

  // const kills = await Image.renderText(boldFont, 24, '30')
  // const deaths = await Image.renderText(boldFont, 24, '66', 0xEB3349ff)
  // const assists = await Image.renderText(boldFont, 24, '4')

  // const kdaCenter = 780

  // canvas.composite(kills, kdaCenter - kills.width - 10, 33)
  // canvas.composite(deaths, kdaCenter, 33)
  // canvas.composite(assists, kdaCenter + deaths.width + 10, 33)

  // const kdaText = await Image.renderText(boldFont, 24, '30 / 5 / 4');
  {
    let scale = 24;
    let kdaText = await makeKDA(
      participant.kills,
      participant.deaths,
      participant.assists,
      boldFont,
      scale
    );

    while (kdaText.width > 125) {
      kdaText = await makeKDA(
        participant.kills,
        participant.deaths,
        participant.assists,
        boldFont,
        --scale
      );
    }
    // const killsText = await Image.renderText(boldFont, scale, `${participant.kills} /`);
    // const deathsText = await Image.renderText(boldFont, scale, ` ${participant.deaths}`, 0xEB3349ff);
    canvas.composite(kdaText, 795 - kdaText.width / 2, 33 + 24 - scale);
    // canvas.composite(deathsText, 795 - kdaText.width / 2 + killsText.width, 33 + 24 - scale)
  }

  const kdaScore = await Image.renderText(
    boldFont,
    20,
    `${(
      (participant.kills + participant.assists) /
      (participant.deaths || 1)
    ).toFixed(1)} KDA`,
    0xfabe4fff
  );
  canvas.composite(kdaScore, 795 - kdaScore.width / 2, 67);

  const totalCS =
    participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const csScore = await Image.renderText(
    boldFont,
    18,
    `${totalCS} CS (${(totalCS / (firstMatch.info.gameDuration / 60)).toFixed(
      1
    )})`,
    0xacbee0ff
  );
  canvas.composite(csScore, 795 - csScore.width / 2, 96);

  canvas.composite(icon.roundCorners(16), 214, 18);

  for (let i = 1; i < matches.length; i++) {
    canvas.composite(
      await makeLabel(matches[i]!, summoner, boldFont, ctx),
      i - 1 > 1 ? canvas.width / 2 - 10 : 0,
      (i - 1) % 2 ? 285 : 165
    );
  }

  const encoded = await canvas.encode(1, {
    description: 'Summoner History. By: Luxanna#6457',
    creationTime: Date.now(),
    author: 'marcock',
  });

  return Buffer.from(encoded);
}

function numberToTimestamp(d: number) {
  const minutes = Math.floor(d / 60);
  const seconds = d % 60;

  return `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
}
