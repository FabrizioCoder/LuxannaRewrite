import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";
import { SummonerLeague } from "./league";
import { SummonerMatches } from "./match";

/**
 * A representation of a RIOT account.
 */
export class Summoner {
  public league?: SummonerLeague;
  public match?: SummonerMatches;
  public id: string;
  public summonerLevel: number;
  public profileIconId: number;
  public name: string;

  constructor(
    public readonly gameName: string,
    public readonly tagLine: string,
    public readonly puuid: string,
    public readonly region: keyof typeof regionalURLs,
    summonerData: components["schemas"]["summoner-v4.SummonerDTO"],
  ) {
    this.id = summonerData.id;
    this.summonerLevel = summonerData.summonerLevel;
    this.profileIconId = summonerData.profileIconId;
    this.name = summonerData.name;
  }

  async getLeague(): Promise<SummonerLeague> {
    if (!this.league) this.league = new SummonerLeague(this.id, this.region);
    return this.league!;
  }

  async getMatches() {
    if (!this.match) this.match = new SummonerMatches(this.puuid, this.region);
    return this.match!;
  }

  // Util Methods
  public static async fetchSummonerPUUID(gameName: string, tagLine: string, region: keyof typeof regionalURLs) {
    const { data: account } = await restClient.GET("/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}", {
      params: {
        path: {
          gameName: gameName,
          tagLine: tagLine,
        },
      },
      overwriteURL: selectRegion(region, true),
    });
    if (!account) return null;
    return account.puuid;
  }

  public static async fetchSummonerData(uuid: string, region: keyof typeof regionalURLs) {
    const { data: summoner } = await restClient.GET("/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}", {
      params: {
        path: {
          encryptedPUUID: uuid,
        },
      },
      overwriteURL: selectRegion(region),
    });

    if (!summoner) return null;
    return summoner;
  }
}
