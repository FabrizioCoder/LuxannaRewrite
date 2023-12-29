import { Image } from 'imagescript';
import { default as Augments } from '../../../json/augments.json';
import * as Champions from '../../../json/champions.json';
import { default as Perks } from '../../../json/perks.json';
import * as SummonerSpells from '../../../json/summoners.json';
import { SummonerMatches } from '../../app/structures/match';
import { Summoner } from '../../app/structures/summoner';
import { Gradients } from '../constants';

function getIcon(version: string, champion: string) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${Object.values(Champions).find(x => x.key === champion)?.id}.png`;
    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(100, 100))
}

function getSpell(version: string, spell: string) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${Object.values(SummonerSpells).find(x => x.key === spell)?.id}.png`;
    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(50, 50))
}

async function getAugment(augment: number) {
    const baseURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default"
    const perkJson = Augments.find(x => x.id === augment)
    if (!perkJson) {
        console.log(augment)
        return new Image(50, 50)
    }
    const url = `${baseURL}/${perkJson?.augmentSmallIconPath.split('assets')[1]?.toLowerCase()}`

    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(50, 50))
}

async function getPerk(perk: number, isSecondary = false) {
    const baseURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default"
    const perkJson = Perks.find(x => x.id === perk)
    if (!perkJson) {
        console.log(perk)
        return new Image(50, 50)
    }
    const url = `${baseURL}/v1${perkJson?.iconPath.split('v1')[1]?.toLowerCase()}`
    if (isSecondary) { }
    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(50, 50))
}

async function makeLabel(match: NonNullable<Awaited<ReturnType<SummonerMatches['getMatchById']>>>, summoner: Summoner) {
    const canvas = new Image(600, 190)
    canvas.fill((x, y) => Gradients.DarkBlue((x + y) / (canvas.width + canvas.height)));

    const participant = match.info.participants.find(x => x.puuid === summoner.puuid)!
    const icon = await getIcon('13.1.1', participant.championId.toString())

    switch (match.info.gameMode) {
        case 'ARAM'://(?)
        case 'CLASSIC': {
            const spells = await Promise.all([
                participant.summoner1Id,
                participant.summoner2Id
            ].map(x => getSpell('13.24.1', x.toString())));

            for (let i = 0; i < spells.length; i++) {
                const spell = spells[i]!
                canvas.composite(spell, 300, i * 50)
            }
            const [primary, secondary] = participant.perks.styles

            const primaryRune = primary!.selections[0]!;
            const secondaryRune = secondary!.selections[0]!;

            const perks = await Promise.all([getPerk(primaryRune.perk), getPerk(secondaryRune.perk, true)]);
            for (let i = 0; i < perks.length; i++) {
                const perk = perks[i]!
                canvas.composite(perk, 350, i * 50)
            }
        } break
        case 'CHERRY': {
            const augments = [participant.playerAugment1, participant.playerAugment2, participant.playerAugment3, participant.playerAugment4].filter(x => x !== undefined) as number[]
            const augmentsIcons = await Promise.all(augments.map(x => getAugment(x)))

            for (let i = 0; i < augmentsIcons.length; i++) {
                const perk = augmentsIcons[i]!
                canvas.composite(perk, i < 2 ? 300 : 350, (i % 2) * 50)
            }
        } break
    }
    canvas.composite(icon, 200)
    return canvas;
}

export async function makeMatchHistory(
    matches: NonNullable<Awaited<ReturnType<SummonerMatches['getMatchById']>>>[],
    summoner: Summoner
) {
    const canvas = new Image(600, matches.length * 200).fill(0x000000ff)

    for (let i = 0; i < matches.length; i++) {
        canvas.composite(await makeLabel(matches[i]!, summoner), 0, (i * 200) + 5)
    }

    const encoded = await canvas.encode(1, {
        description: 'Summoner History. By: Luxanna#6457',
        creationTime: Date.now(),
        author: 'marcock',
    });

    return Buffer.from(encoded);
}
