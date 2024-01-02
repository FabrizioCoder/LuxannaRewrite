import fs from 'fs/promises';
import satori from 'satori';
import svg2img from 'svg2img';
import { join } from 'path';
// import { html } from "satori-html";


export async function test() {
    //@ts-nocheck
    const { html } = await (eval('import("satori-html")') as Promise<typeof import('satori-html')>);
    const robotoArrayBuffer = await fs.readFile(join(process.cwd(), 'assets', 'fonts', 'BeaufortforLOL-Medium.ttf'));
    // const base64Image = fs.readFileSync('./out1.png', 'base64');
    // console.log(base64Image)
    const markup = html`
    <div style="height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; font-size: 32px; font-weight: 600;">
    <svg width="75" viewBox="0 0 75 65" fill="#000" style="margin: 0 75px;">
      <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
    </svg>
    
    <div style="margin-top: 40px;">Hello, World</div>
  </div>
`;
    //<img src="data:image/png;base64,${base64Image}" style="width: 100px; height: 100px; margin: 20px 0;" />

    const svg = await satori(markup, {
        width: 600,
        height: 400,
        fonts: [{
            name: 'Roboto',
            data: robotoArrayBuffer,
            weight: 400,
            style: 'normal',
        },],
    });

    svg2img(svg, {
        //@ts-ignore
        quality: 100, format: 'png'
    }, (_, buffer) => {
        //returns a Buffer
        fs.writeFile('out.png', buffer)
    })
}