import { restClient } from "../../lib/rest";
import { selectRegion } from "../../utils/functions";
import { SummonerLeague } from "./league";
import {SummonerMatches} from "./match";

/**
 * A representation of a RIOT account.
 */
export class Summoner {
  public level?: number;
  public profileIconId?: number;
  public name?: string;
  public id?: string;
  public summonerLevel?: number;
  public league?: SummonerLeague;
  public match?: SummonerMatches;

  constructor(
    public readonly gameName: string,
    public readonly tagLine: string,
    public readonly puuid: string,
    public readonly region: string,
  ) {
  }

  async getLeague(): Promise<SummonerLeague> {

    if(!this.id) await this.fetchSummonerData();

    if (!this.league) {
      this.league = new SummonerLeague(this.id!, this.region);
    }

    return this.league;
  }

  async getMatches() {
    if(!this.match) {
      this.match = new SummonerMatches(this.puuid, this.region);
    }

    return this.match;
  }

  async getSummonerData() {
    if (!this.id) await this.fetchSummonerData();
    return this;
  }

  async fetchSummonerData() {
    const { data: summoner } = await restClient.GET("/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}", {
      params: {
        path: {
          encryptedPUUID: this.puuid,
        },
      },
      overwriteURL: selectRegion(this.region),
    });

    if (!summoner) return null;
    Object.assign(this, summoner);
    return this;
  }
}
