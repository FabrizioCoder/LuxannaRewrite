import { readFile } from 'fs/promises';
import { Image } from "imagescript";
import { join } from "path";
import { SummonerLeague } from "../../app/structures/league";
import { Summoner } from "../../app/structures/summoner";
import { HextechColors } from "../constants";

const rankedFile = {
  UNRANKED: join(process.cwd(), "assets", "ranked", "unranked.png"),
  IRON: join(process.cwd(), "assets", "ranked", "iron.png"),
  BRONZE: join(process.cwd(), "assets", "ranked", "bronze.png"),
  SILVER: join(process.cwd(), "assets", "ranked", "silver.png"),
  GOLD: join(process.cwd(), "assets", "ranked", "gold.png"),
  PLATINUM: join(process.cwd(), "assets", "ranked", "platinum.png"),
  EMERALD: join(process.cwd(), "assets", "ranked", "emerald.png"),
  DIAMOND: join(process.cwd(), "assets", "ranked", "diamond.png"),
  MASTER: join(process.cwd(), "assets", "ranked", "master.png"),
  GRANDMASTER: join(process.cwd(), "assets", "ranked", "grandmaster.png"),
  CHALLENGER: join(process.cwd(), "assets", "ranked", "challenger.png"),
} as const;

const noShowRank = ["CHALLENGER", "GRANDMASTER", "MASTER"];

async function createRank(name: string, data: Awaited<ReturnType<SummonerLeague['getSoloQueue'] | SummonerLeague['getFlexQueue'] | SummonerLeague['getTFTQueue']>>, font: Buffer) {
  const canvas = new Image(200, 256)

  const icon = data
    ? await readFile(rankedFile[data.tier! as keyof typeof rankedFile])
    : await readFile(rankedFile.UNRANKED);
  const decoded = await Image.decode(icon);
  canvas.composite(decoded, 32, 48);

  // TEXT
  const soloQText = await Image.renderText(font, 13, name, HextechColors.GOLD2);
  canvas.composite(soloQText, ((decoded.width / 2) + 32) - (soloQText.width / 2), 184);

  // TIER
  const dataRank = await Image.renderText(
    font,
    15,
    data?.tier ? `${data.tier}${noShowRank.includes(data.tier) ? "" : ` ${data.rank}`}` : "UNRANKED",
    0xffffffff,
  );
  canvas.composite(dataRank, ((decoded.width / 2) + 32) - (dataRank.width / 2), 199);

  // Solo/Duo WINS LP
  const dataLP = await Image.renderText(
    font,
    13,
    data ? `${data.wins} wins | ${data.leaguePoints!} LP` : "0 wins | 0 LP",
    HextechColors.GOLD2,
  );
  canvas.composite(dataLP, ((decoded.width / 2) + 32) - (dataLP.width / 2), 218);

  return canvas;
}

export async function makeRankedProfile(data: SummonerLeague, summoner: Summoner) {
  const canvas = await Image.decode(await readFile(join(process.cwd(), 'assets', 'ranked', 'background.png')));
  const boldFont = await readFile(join(process.cwd(), "assets", "fonts", "BeaufortforLOL-Bold.ttf"));

  {
    const labelNameImage = await Image.renderText(
      boldFont,
      20,
      `${summoner.gameName.toUpperCase()}#${summoner.tagLine}`,
      HextechColors.GOLD1,
    );
    canvas.composite(labelNameImage, canvas.width / 2 - labelNameImage.width / 2, 20);
  }

  {
    // Solo/duo (left)
    const soloQ = await data.getSoloQueue();
    const soloQImage = await createRank('SOLO/DUO', soloQ, boldFont);
    canvas.composite(soloQImage)
  }

  {
    // Flex (center)
    const flex = await data.getFlexQueue();
    const flexImage = await createRank('FLEX', flex, boldFont);
    canvas.composite(flexImage, 181)
  }

  {
    // Tft (right)
    const tft = await data.getTFTQueue();
    const tftImage = await createRank('TFT', tft, boldFont);
    canvas.composite(tftImage, 364)
  }

  const encoded = await canvas.encode(1, {
    description: "Summoner Profile. By: Luxanna#6457",
    creationTime: Date.now(),
    author: "marcock",
  });

  return Buffer.from(encoded);
}
