import { regionalURLs } from '../../utils/functions';
import { Summoner } from '../structures/summoner';
import { LuxannaStore } from './cacheManager';

export class SummonersManager {
  summoners: Map<string, Summoner> = new Map();

  private static instance: SummonersManager;

  public static getInstance(): SummonersManager {
    if (!SummonersManager.instance) {
      SummonersManager.instance = new SummonersManager();
    }
    return SummonersManager.instance;
  }

  public async add(summoner: Summoner) {
    await LuxannaStore.getInstance().set(
      `${summoner.region}:${summoner.gameName}:${summoner.tagLine}`,
      summoner,
      { ex: 300 }
    );
  }

  async get(identifier: string) {
    let summoner = (await LuxannaStore.getInstance().get(
      identifier
    )) as Summoner;

    if (summoner)
      return new Summoner(
        summoner.gameName,
        summoner.tagLine,
        summoner.puuid,
        summoner.region,
        summoner
      );

    const [region, gameName, tagLine] = identifier.split(':') as [
      keyof typeof regionalURLs,
      string,
      string
    ];
    const summonerPUUID = await Summoner.fetchPUUID(gameName, tagLine, region);

    if (!summonerPUUID) return null;

    const summonerData = await Summoner.fetchData(summonerPUUID, region);
    if (!summonerData) return null;

    summoner = new Summoner(
      gameName,
      tagLine,
      summonerPUUID,
      region,
      summonerData
    );

    this.add(summoner);

    return summoner;
  }
}
