import { readFile } from 'fs/promises';
import { join } from 'path';
import satori from 'satori';
import sharp from 'sharp';

export async function makeLinkedProfile(riotId: string, iconUrl: string) {
  const { html } = await (eval('import("satori-html")') as Promise<
    typeof import('satori-html')
  >);
  const robotoArrayBuffer = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Bold.ttf')
  );

  const markup = html`
    <body>
      <div class="profile">
        <p id="watermark">@Luxanna#6457</p>
        <img src=${iconUrl} alt="profile" id="icon" />
        <h1 id="riotId">${riotId}</h1>
      </div>
    </body>

    <style>
      div {
        width: 578px;
        height: 256px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-image: url('https://i.imgur.com/wL7rh0n.jpge');
        font-family: 'Beaufortfor-Bold';
        color: #c89b3c;
      }
      #icon {
        height: 135px;
        width: 135px;
        border-radius: 50%;
        margin-top: 5px;
      }
      #riotId {
        font-size: 25px;
        font-weight: bold;
        margin-top: 5px;
      }
      #watermark {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0px;
        font-size: 10px;
        color: #6b6b6b;
      }
    </style>
  `;

  const svg = await satori(markup, {
    width: 578,
    height: 256,
    fonts: [
      {
        name: 'Beaufortfor-Bold',
        data: robotoArrayBuffer,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  return await sharp(Buffer.from(svg))
    .png({
      compressionLevel: 0,
      quality: 100,
      effort: 10,
    })
    .toBuffer();
}
