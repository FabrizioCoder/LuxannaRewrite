import { PotoClient } from '@potoland/core';
import { regionalURLs } from "../../utils/functions";
import { Summoner } from "../structures/summoner";

export class SummonersManager {
  constructor(public client: PotoClient) { }

  private static instance: SummonersManager;

  public static getInstance(client: PotoClient): SummonersManager {
    if (!SummonersManager.instance) {
      SummonersManager.instance = new SummonersManager(client);
    }
    return SummonersManager.instance;
  }

  public addSummoner(summoner: Summoner) {
    this.client.store.set(`${summoner.region}:${summoner.gameName}:${summoner.tagLine}`, summoner, {
      ex: 300
    });
  }

  async getSummoner(identifier: string) {
    let summoner = <Summoner><unknown>(await this.client.store.get(identifier));

    if (summoner) return new Summoner(summoner.gameName, summoner.tagLine, summoner.puuid, summoner.region, summoner! as any);



    const [region, gameName, tagLine] = identifier.split(":") as [keyof typeof regionalURLs, string, string];
    const summonerPUUID = await Summoner.fetchSummonerPUUID(gameName, tagLine, region);

    if (!summonerPUUID) return null;

    const summonerData = await Summoner.fetchSummonerData(summonerPUUID, region);
    if (!summonerData) return null;

    summoner = new Summoner(gameName, tagLine, summonerPUUID, region, summonerData);

    this.addSummoner(summoner);

    return summoner;
  }
}
