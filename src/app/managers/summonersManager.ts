import { restClient } from "../../lib/rest";
import { regionalURLs, selectRegion } from "../../utils/functions";
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

    if (!summoner) {
      const [region, gameName, tagLine] = identifier.split(":") as [keyof typeof regionalURLs, string, string];
      const summonerPUUID = await SummonersManager.fetchByRiotId(gameName, tagLine, region);
      if (!summonerPUUID) return null;

      summoner = new Summoner(gameName!, tagLine!, summonerPUUID, region!);
      this.addSummoner(summoner);
    }

    return summoner;
  }

  public static async fetchByRiotId(gameName: string, tagLine: string, region: keyof typeof regionalURLs) {
    const { data: account } = await restClient.GET("/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}", {
      params: {
        path: {
          gameName: encodeURIComponent(gameName),
          tagLine,
        },
      },
      overwriteURL: selectRegion(region, true),
    });

    if (!account) return null;
    return account.puuid;
  }
}
