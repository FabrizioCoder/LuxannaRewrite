import { readFile } from 'fs/promises';
import { Image } from 'imagescript';
import { join } from 'path';
import { SummonerLeague } from '../../app/structures/league';
import { Summoner } from '../../app/structures/summoner';
import { HextechColors, TierLevel, TierOrder } from '../constants';
import { components } from '../../lib/schema';

const rankedFile = {
  UNRANKED: join(process.cwd(), 'assets', 'ranked', 'unranked.png'),
  IRON: join(process.cwd(), 'assets', 'ranked', 'iron.png'),
  BRONZE: join(process.cwd(), 'assets', 'ranked', 'bronze.png'),
  SILVER: join(process.cwd(), 'assets', 'ranked', 'silver.png'),
  GOLD: join(process.cwd(), 'assets', 'ranked', 'gold.png'),
  PLATINUM: join(process.cwd(), 'assets', 'ranked', 'platinum.png'),
  EMERALD: join(process.cwd(), 'assets', 'ranked', 'emerald.png'),
  DIAMOND: join(process.cwd(), 'assets', 'ranked', 'diamond.png'),
  MASTER: join(process.cwd(), 'assets', 'ranked', 'master.png'),
  GRANDMASTER: join(process.cwd(), 'assets', 'ranked', 'grandmaster.png'),
  CHALLENGER: join(process.cwd(), 'assets', 'ranked', 'challenger.png'),
} as const;

const noShowRank = ['CHALLENGER', 'GRANDMASTER', 'MASTER'];

type League = components['schemas']['league-v4.LeagueEntryDTO'];

async function createRank(name: string, data: League, font: Buffer) {
  const canvas = new Image(200, 256);

  const icon = data
    ? await readFile(rankedFile[data.tier! as keyof typeof rankedFile])
    : await readFile(rankedFile.UNRANKED);
  const decoded = await Image.decode(icon);
  canvas.composite(decoded, 32, 48);

  // TEXT
  const soloQText = await Image.renderText(font, 14, name, HextechColors.GOLD2);
  canvas.composite(
    soloQText,
    decoded.width / 2 + 32 - soloQText.width / 2,
    184
  );

  // TIER
  const dataRank = await Image.renderText(
    font,
    16,
    data?.tier
      ? `${data.tier}${noShowRank.includes(data.tier) ? '' : ` ${data.rank}`}`
      : 'UNRANKED',
    0xffffffff
  );
  canvas.composite(dataRank, decoded.width / 2 + 32 - dataRank.width / 2, 199);

  // WINS LP
  const dataLP = await Image.renderText(
    font,
    14,
    data ? `${data.wins} wins | ${data.leaguePoints!} LP` : '0 wins | 0 LP',
    HextechColors.GOLD2
  );
  canvas.composite(dataLP, decoded.width / 2 + 32 - dataLP.width / 2, 218);

  return canvas;
}

export async function makeRankedProfile(
  data: SummonerLeague,
  summoner: Summoner
) {
  const canvas = await Image.decode(
    await readFile(join(process.cwd(), 'assets', 'ranked', 'background.png'))
  );
  const boldFont = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Bold.ttf')
  );

  {
    const labelNameImage = await Image.renderText(
      boldFont,
      20,
      `${summoner.gameName.toUpperCase()}#${summoner.tagLine}`,
      HextechColors.GOLD1
    );
    canvas.composite(
      labelNameImage,
      canvas.width / 2 - labelNameImage.width / 2,
      20
    );
  }

  const league = await data.fetchSummonerLeague()!;

  const flex = league?.filter((i) => i.queueType === 'RANKED_FLEX_SR')[0]!;
  const soloQ = league?.filter((i) => i.queueType === 'RANKED_SOLO_5x5')[0]!;
  const tft = league?.filter((i) => i.queueType === 'RANKED_TFT')[0]!;

  const highest = [soloQ, flex, tft].sort((a, b) => {
    const tier =
      TierOrder[a?.tier! as keyof typeof TierOrder] -
      TierOrder[b?.tier! as keyof typeof TierOrder];
    if (tier !== 0) {
      return tier;
    }

    return (
      TierLevel[a?.rank! as keyof typeof TierLevel] -
      TierLevel[b?.rank! as keyof typeof TierLevel]
    );
  });

  let soloQPos = 0;
  let flexPos = 0;
  let tftPos = 0;

  switch (highest[0]) {
    case soloQ:
      soloQPos = 181;
      flexPos = 0;
      tftPos = 364;
      break;
    case flex:
      soloQPos = 0;
      flexPos = 181;
      tftPos = 364;
      break;
    case tft:
      soloQPos = 0;
      flexPos = 364;
      tftPos = 181;
      break;
  }

  // Solo/duo
  const soloQImage = await createRank('SOLO/DUO', soloQ, boldFont);
  canvas.composite(soloQImage, soloQPos);

  // Flex
  const flexImage = await createRank('FLEX', flex, boldFont);
  canvas.composite(flexImage, flexPos);

  // Tft (right)
  const tftImage = await createRank('TFT', tft, boldFont);
  canvas.composite(tftImage, tftPos);

  const encoded = await canvas.encode(1, {
    description: 'Summoner Profile. By: Luxanna#6457',
    creationTime: Date.now(),
    author: 'marcock',
  });

  return Buffer.from(encoded);
}
