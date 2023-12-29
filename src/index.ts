import { join } from 'path';
// import { main } from './app/client';
// main();
import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { SummonersManager } from './app/managers/summonersManager';
import { SummonerMatches } from './app/structures/match';
import { makeMatchHistory } from './utils/images/history';

async function draw() {
    const matches = JSON.parse((await readFile(join(process.cwd(), 'res.json'))).toString()) as unknown as NonNullable<Awaited<ReturnType<SummonerMatches['getMatchById']>>>[]
    const summoner = (await SummonersManager.getInstance().getSummoner(
        'lan:FabrizioCoder:6030'
    ))!

    await writeFile(
        join(process.cwd(), 'res.png'), await makeMatchHistory(matches.slice(0, 5), summoner)
    )
    // const matchesId = await (await summoner.getMatches()).getMatchesHistory() ?? []
    // const matches = await Promise.all(matchesId.map(x => summoner.match?.getMatchById(x)))

    // console.log(matches)

    // await writeFile(join(process.cwd(), 'res.json'), JSON.stringify(matches))
}

draw()