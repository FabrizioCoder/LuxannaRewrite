import { Image } from 'imagescript';
import { readFile } from 'fs/promises';
import { SummonerLeague } from '../../app/structures/league';
import { HextechColors, gardients } from '../constants';
import { join } from 'path';
// require('src\\utils\\images\\assets\\ranked\\');
//dios mio pq pones las imagenes en el src XD
//cambia.
//que saques assets afuera puta
//si
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

const positions = {
  UNRANKED: {
    x: 0,
    y: 0,
  },
    IRON: {
        x: 0,
        y: 0,
    },
};

export async function makeRankedProfile(data: SummonerLeague) {
  const image = new Image(550, 250);
  image.fill((x, y) =>
    gardients.DarkBlue((x + y) / (image.width + image.height))
  );

  const regularFont = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Regular.ttf')
  );
  const boldFont = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Bold.ttf')
  );

  {
    // Solo/Duo (left)
    const soloQ = await data.getSoloQueue();

    const soloQIcon = soloQ
      ? await readFile(rankedFile[soloQ.tier! as keyof typeof rankedFile])
      : await readFile(rankedFile.UNRANKED);
    const decodedSoloQ = await Image.decode(soloQIcon);
    image.composite(decodedSoloQ.resize(150, 150), 12, 50);

    // Solo/Duo TEXT
    const soloQText = await Image.renderText(
      regularFont,
      10,
      'SOLO/DUO',
      HextechColors.GOLD2
    );
    image.composite(soloQText, 62, 187);

    // Solo/Duo TIER
    const soloQRank = await Image.renderText(
      boldFont,
      12,
      soloQ ? soloQ.tier! : 'UNRANKED',
      0xffffffff
    );
    image.composite(soloQRank, 49, 203);

    // Solo/Duo WINS LP
    const soloQLP = await Image.renderText(
      regularFont,
      10,
      soloQ ? `${soloQ.wins} wins | ${soloQ.leaguePoints!} LP` : '',
      HextechColors.GOLD2
    );
    image.composite(soloQLP, 59, 221);
  }

  {
    // Flex (center)
    const flex = await data.getFlexQueue();
    const flexIcon = flex
      ? await readFile(rankedFile[flex.tier! as keyof typeof rankedFile])
      : await readFile(rankedFile.UNRANKED);
    const decodedFlex = await Image.decode(flexIcon);

    image.composite(decodedFlex.resize(150, 150), 200, 50);

    // Flex TEXT
    const flexText = await Image.renderText(
      regularFont,
      10,
      'FLEX - 5V5',
      HextechColors.GOLD2
    );
    image.composite(flexText, 251, 187);

    // Flex TIER
    const flexRank = await Image.renderText(
      boldFont,
      12,
      flex ? flex.tier! : 'UNRANKED',
      0xffffffff
    );
    image.composite(flexRank, 237, 203);

    // Flex WINS LP
    const flexLP = await Image.renderText(
      regularFont,
      10,
      flex ? `${flex.wins} wins | ${flex.leaguePoints!} LP` : '',
      HextechColors.GOLD2
    );
    image.composite(flexLP, 247, 221);
  }

  const encoded = await image.encode(1, {
    description: 'Summoner Profile. By: Luxanna#6457',
    creationTime: Date.now(),
    author: 'Fabrizio Santana',
  });

  return Buffer.from(encoded);
  //   return Buffer.from(encoded);
  //   await writeFile('src/utils/images/ranked.ts/test.png', encoded);
}
