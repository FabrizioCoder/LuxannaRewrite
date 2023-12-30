import { readFile } from 'fs/promises';
import { Image } from 'imagescript';
import { join } from 'path';
import { default as Augments } from '../../../json/augments.json';
import * as Champions from '../../../json/champions.json';
import { default as Perks } from '../../../json/perks.json';
import * as SummonerSpells from '../../../json/summoners.json';
import { SummonerMatches } from '../../app/structures/match';
import { Summoner } from '../../app/structures/summoner';

const paths = {
    background: join(process.cwd(), 'assets', 'history', 'background.png')
} as const

function getIcon(version: string, champion: string, size = 120) {
    const url = `https://prod.api.assets.riotgames.com/public/v1/asset/lol/${version}/CHAMPION/${Object.values(Champions).find(x => x.key === champion)?.key}/ICON?width=${size}&height=${size}&auto=png`
    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
}

function getSpell(version: string, spell: string) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${Object.values(SummonerSpells).find(x => x.key === spell)?.id}.png`;
    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(44, 44))
}

function getItem(version: string, item: number) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`;
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
        return new Image(44, 44)
    }
    const url = `${baseURL}/${perkJson?.augmentSmallIconPath.split('assets')[1]?.toLowerCase()}`

    return fetch(url)
        .then(x => x.arrayBuffer() as Promise<Buffer>)
        .then(x => Image.decode(x))
        .then(x => x.resize(44, 44))
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
        .then(x => x.resize(44, 44))
}

async function makeLabel(match: NonNullable<Awaited<ReturnType<SummonerMatches['getMatchById']>>>, summoner: Summoner, boldFont: Buffer) {
    const canvas = new Image(600, 190)
    // canvas.fill((x, y) => Gradients.DarkBlue((x + y) / (canvas.width + canvas.height)));

    const participant = match.info.participants.find(x => x.puuid === summoner.puuid)!
    const icon = (await getIcon('13.24.1', participant.championId.toString(), 91)).roundCorners(16)

    console.log(match.info.gameMode)

    switch (match.info.gameMode) {
        default: {
            const spells = await Promise.all([
                participant.summoner1Id,
                participant.summoner2Id
            ].map(x => getSpell('13.24.1', x.toString())));

            // for (let i = 0; i < spells.length; i++) {
            //     const spell = spells[i]!
            //     canvas.composite(spell, 300, i * 50)
            // }
            const [primary, secondary] = participant.perks.styles

            const primaryRune = primary!.selections[0]!;
            const secondaryRune = secondary!.selections[0]!;

            const perks = await Promise.all([getPerk(primaryRune.perk), getPerk(secondaryRune.perk, true)]);
            // for (let i = 0; i < perks.length; i++) {
            //     const perk = perks[i]!
            //     canvas.composite(perk, 350, i * 50)
            // }
            const images = [...spells, ...perks]
            for (let i = 0; i < 4; i++) {
                const image = images[i]!.cropCircle()
                canvas.composite(image, i < 2 ? 265 : 365, (i % 2) * 50)
            }
            const visionScore = await Image.renderText(boldFont, 16, participant.visionScore!.toString())
            canvas.composite(visionScore, 336 - visionScore.width / 2, 62)
        } break
        case 'CHERRY': {
            const places = ['st', 'nd', 'rd', 'th'];
            const subteamPlacement = await Image.renderText(boldFont, 16, participant.subteamPlacement!.toString() + places[participant.subteamPlacement! - 1]);

            canvas.composite(subteamPlacement, 336 - subteamPlacement.width / 2, 62)
            const augments = [participant.playerAugment1, participant.playerAugment2, participant.playerAugment3, participant.playerAugment4].filter(x => x !== undefined) as number[]
            const augmentsIcons = await Promise.all(augments.map(x => getAugment(x)))

            for (let i = 0; i < augmentsIcons.length; i++) {
                const perk = augmentsIcons[i]!
                canvas.composite(perk, i < 2 ? 265 : 365, (i % 2) * 50)
            }
        } break
    }

    const ward = (await getItem('13.24.1', participant.item6)).roundCorners(6);
    canvas.composite(ward, 311, 10)

    canvas.composite(icon, 155);
    return canvas;
}

export async function makeMatchHistory(
    matches: NonNullable<Awaited<ReturnType<SummonerMatches['getMatchById']>>>[],
    summoner: Summoner
) {
    const canvas = await Image.decode(await readFile(paths.background))
    const boldFont = await readFile(join(process.cwd(), "assets", "fonts", 'history', "KumbhSans-Bold.ttf"));

    const firstMatch = matches[0]!;
    const participant = firstMatch.info.participants.find(x => x.puuid === summoner.puuid)!
    const icon = await getIcon('13.24.1', participant.championId.toString())

    const text = await Image.renderText(boldFont, 26, firstMatch.info.gameMode);
    canvas.composite(text, 96 - text.width / 2, 34);

    const winOrDefeat = await Image.renderText(boldFont, 22, participant.win ? 'WIN' : 'LOSE', participant.win ? 0x93F9B9ff : 0xEB3349ff);
    canvas.composite(winOrDefeat, 85 - winOrDefeat.width, 83);

    const time = await Image.renderText(boldFont, 18, '16:63', 0xAAB7D1ff);
    canvas.composite(time, 108, 86);

    switch (firstMatch.info.gameMode) {
        case 'CHERRY': {
            const augments = [participant.playerAugment1, participant.playerAugment2, participant.playerAugment3, participant.playerAugment4].filter(x => x !== undefined) as number[]
            const augmentsIcons = await Promise.all(augments.map(x => getAugment(x)))

            for (let i = 0; i < augmentsIcons.length; i++) {
                const perk = augmentsIcons[i]!
                canvas.composite(perk, 365 + (i > 1 ? 56 : 0), (i % 2) * 58 + 27)
            }

            const places = ['st', 'nd', 'rd', 'th'];
            const subteamPlacement = await Image.renderText(boldFont, 16, participant.subteamPlacement!.toString() + places[participant.subteamPlacement! - 1]);

            canvas.composite(subteamPlacement, 694 - subteamPlacement.width / 2, 95)
        } break
        default: {
            const spells = await Promise.all([
                participant.summoner1Id,
                participant.summoner2Id
            ].map(x => getSpell('13.24.1', x.toString())));

            for (let i = 0; i < spells.length; i++) {
                const spell = spells[i]!
                canvas.composite(spell.cropCircle(), 353, i * 58 + 27)
            }

            const [primary, secondary] = participant.perks.styles

            const primaryRune = primary!.selections[0]!;
            const secondaryRune = secondary!.selections[0]!;

            const perks = await Promise.all([getPerk(primaryRune.perk), getPerk(secondaryRune.perk, true)]);
            for (let i = 0; i < perks.length; i++) {
                const perk = perks[i]!
                canvas.composite(perk, 422, i * 58 + 27)
            }

            const visionScore = await Image.renderText(boldFont, 16, participant.visionScore!.toString())
            canvas.composite(visionScore, 694 - visionScore.width / 2, 95)
        } break;
    }
    const build = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
    ].filter(x => x)

    for (let i = 0; i < build.length; i++) {
        const item = build[i]!
        const icon = await getItem('13.24.1', item)

        const x = i % 3
        const y = Math.floor(i / 3);

        console.log({ x, y })

        canvas.composite(icon, 501 + 56 * x, 24 + y * 58)
    }

    const ward = await getItem('13.24.1', participant.item6)
    canvas.composite(ward, 669, 42)

    // const kills = await Image.renderText(boldFont, 24, '30')
    // const deaths = await Image.renderText(boldFont, 24, '66', 0xEB3349ff)
    // const assists = await Image.renderText(boldFont, 24, '4')

    // const kdaCenter = 780

    // canvas.composite(kills, kdaCenter - kills.width - 10, 33)
    // canvas.composite(deaths, kdaCenter, 33)
    // canvas.composite(assists, kdaCenter + deaths.width + 10, 33)

    // const kdaText = await Image.renderText(boldFont, 24, '30 / 5 / 4');
    {
        let scale = 24
        let kdaText = await Image.renderText(boldFont, scale, `${participant.kills} / ${participant.deaths} / ${participant.assists}`);

        while (kdaText.width > 125) {
            kdaText = await Image.renderText(boldFont, --scale, `${participant.kills} / ${participant.deaths} / ${participant.assists}`);
        }
        const killsText = await Image.renderText(boldFont, scale, `${participant.kills} /`);
        const deathsText = await Image.renderText(boldFont, scale, ` ${participant.deaths}`, 0xEB3349ff);
        canvas.composite(kdaText, 795 - kdaText.width / 2, 33 + 24 - scale)
        canvas.composite(deathsText, 795 - kdaText.width / 2 + killsText.width, 33 + 24 - scale)
    }

    const kdaScore = await Image.renderText(boldFont, 20, ((participant.kills + participant.assists) / (participant.deaths || 1)).toFixed(1) + ' KDA', 0xFABE4Fff)
    canvas.composite(kdaScore, 795 - kdaScore.width / 2, 67)

    const csScore = await Image.renderText(boldFont, 18, `${participant.totalMinionsKilled} CS (${(participant.totalMinionsKilled / (firstMatch.info.gameDuration / 60)).toFixed(1)})`, 0xACBEE0ff)
    canvas.composite(csScore, 795 - csScore.width / 2, 96)

    canvas.composite(icon.roundCorners(16), 214, 18)

    for (let i = 1; i < matches.length; i++) {
        canvas.composite(await makeLabel(matches[i]!, summoner, boldFont), (i - 1) > 1 ? canvas.width / 2 - 10 : 0, (i - 1) % 2 ? 285 : 165)
    }

    const encoded = await canvas.encode(1, {
        description: 'Summoner History. By: Luxanna#6457',
        creationTime: Date.now(),
        author: 'marcock',
    });

    return Buffer.from(encoded);
}