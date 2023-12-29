import { readFile } from 'fs/promises';
import { Image } from 'imagescript';
import { HextechColors } from '../constants';
import { Summoner } from '../../app/structures/summoner';
import { join } from 'path';
import { makeIconURL } from '../functions';

export async function makeLinkedAccount(
  riotId: string,
  region: string,
  summoner: Summoner
) {
  const canvas = await Image.decode(
    await readFile(join(process.cwd(), 'assets', 'link', 'background.png'))
  );
  const boldFont = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Bold.ttf')
  );

  // Icon
  const iconURL = makeIconURL('13.24.1', summoner.profileIconId);
  const iconBuffer = await fetch(iconURL);
  const image = await Image.decode((await iconBuffer.arrayBuffer()) as Buffer);
  canvas.composite(image.resize(80, 80).cropCircle(), 140, 1);

  // RiotId
  const rioIDText = await Image.renderText(
    boldFont,
    30,
    riotId,
    HextechColors.GOLD2
  );
  canvas.composite(rioIDText, canvas.width / 2 - rioIDText.width / 2, 81);

  // Region
  const regionText = await Image.renderText(
    boldFont,
    24,
    region.toUpperCase(),
    HextechColors.GREY2
  );
  canvas.composite(
    regionText,
    canvas.width / 2 - regionText.width / 2,
    81 + rioIDText.height
  );

  const encoded = await canvas.encode(1, {
    description: 'Summoner Linked. By: Luxanna#6457',
    creationTime: Date.now(),
    author: 'fabrizio',
  });

  return Buffer.from(encoded);
}
