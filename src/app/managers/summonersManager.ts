import { Client } from 'biscuitjs';
import { regionalURLs } from '../../utils/functions';
import { Summoner } from '../structures/summoner';

export class SummonersManager {
  summoners: Map<string, Summoner> = new Map();
  constructor(public client: Client) {}

  private static instance: SummonersManager;

  public static getInstance(client: Client): SummonersManager {
    if (!SummonersManager.instance) {
      SummonersManager.instance = new SummonersManager(client);
    }
    return SummonersManager.instance;
  }

  public addSummoner(summoner: Summoner) {
    this.summoners.set(
      `${summoner.region}:${summoner.gameName}:${summoner.tagLine}`,
      summoner
    );
  }

  async getSummoner(identifier: string) {
    let summoner = <Summoner>this.summoners.get(identifier);

    if (summoner)
      return new Summoner(
        summoner.gameName,
        summoner.tagLine,
        summoner.puuid,
        summoner.region,
        summoner! as any
      );

    const [region, gameName, tagLine] = identifier.split(':') as [
      keyof typeof regionalURLs,
      string,
      string
    ];
    const summonerPUUID = await Summoner.fetchSummonerPUUID(
      gameName,
      tagLine,
      region
    );

    if (!summonerPUUID) return null;

    const summonerData = await Summoner.fetchSummonerData(
      summonerPUUID,
      region
    );
    if (!summonerData) return null;

    summoner = new Summoner(
      gameName,
      tagLine,
      summonerPUUID,
      region,
      summonerData
    );

    this.addSummoner(summoner);

    return summoner;
  }
}
