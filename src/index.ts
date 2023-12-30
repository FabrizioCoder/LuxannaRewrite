import { main } from './app/client';
main();
// import 'dotenv/config';
// import { writeFile } from 'fs/promises';
// import { join } from 'path';
// import { SummonersManager } from './app/managers/summonersManager';
// import { makeMatchHistory } from './utils/images/history';

// async function draw() {
//     const summoner = (await SummonersManager.getInstance().getSummoner(
//         'lan:MARCROCK22:lan'
//         // 'lan:FreeAoi:0001'
//     ))!
//     const matchesId = await (await summoner.getMatches()).getMatchesHistory() ?? []
//     const matches = await Promise.all(matchesId.map(x => summoner.match?.getMatchById(x)))

//     console.log(matches)

//     await writeFile(
//         //@ts-expect-error
//         join(process.cwd(), 'res.png'), await makeMatchHistory(matches.slice(0, 5), summoner)
//     )
// }

// draw()