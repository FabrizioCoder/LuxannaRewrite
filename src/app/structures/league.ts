import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";

type League = components["schemas"]["league-v4.LeagueEntryDTO"];

export class SummonerLeague {
  private RANKED_SOLO_5x5?: League;
  private RANKED_FLEX_SR?: League;
  private RANKED_TFT?: League | null;

  constructor(readonly summonerId: string, readonly summonerRegion: keyof typeof regionalURLs) {}

  async getSoloQueue() {
    if (!this.RANKED_SOLO_5x5) await this.fetchSummonerLeague();
    return this.RANKED_SOLO_5x5!;
  }

  async getFlexQueue() {
    if (!this.RANKED_FLEX_SR) await this.fetchSummonerLeague();
    return this.RANKED_FLEX_SR!;
  }

  async getTFTQueue() {
    if (!this.RANKED_TFT) await this.fetchSummonerLeague();
    return this.RANKED_TFT;
  }

  async fetchSummonerLeague() {
    const { data: leagues } = await restClient.GET("/lol/league/v4/entries/by-summoner/{encryptedSummonerId}", {
      params: {
        path: {
          encryptedSummonerId: this.summonerId,
        },
      },
      overwriteURL: selectRegion(this.summonerRegion),
    });

    if (leagues) {
      for (const league of leagues) {
        switch (league.queueType) {
          case "RANKED_SOLO_5x5":
            this.RANKED_SOLO_5x5 = league;
            break;
          case "RANKED_FLEX_SR":
            this.RANKED_FLEX_SR = league;
            break;
          case "RANKED_TFT":
            this.RANKED_TFT = league;
            break;
        }
      }
    }
  }
}
