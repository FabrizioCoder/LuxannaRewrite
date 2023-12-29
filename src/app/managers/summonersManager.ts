import { regionalURLs } from "../../utils/functions";
import { Summoner } from "../structures/summoner";

export class SummonersManager {
  // key: region:gameName:tagLine
  summoners: Map<string, Summoner> = new Map();

  private static instance: SummonersManager;

  public static getInstance(): SummonersManager {
    if (!SummonersManager.instance) {
      SummonersManager.instance = new SummonersManager();
    }

    return SummonersManager.instance;
  }

  public addSummoner(summoner: Summoner) {
    this.summoners.set(`${summoner.region}:${summoner.gameName}:${summoner.tagLine}`, summoner);
  }

  async getSummoner(identifier: string) {
    let summoner = this.summoners.get(identifier);

    // If the summoner is already "cached", return it.
    if (summoner) return summoner;

    // If the summoner isn't cached, fetch it from RIOT API.
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
