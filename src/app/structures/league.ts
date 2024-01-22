import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";
import { LuxannaStore } from "../managers/cacheManager";

type League = components["schemas"]["league-v4.LeagueEntryDTO"];

export class SummonerLeague {
  private RANKED_SOLO_5x5?: League;
  private RANKED_FLEX_SR?: League;
  private RANKED_TFT?: League | null;

  constructor(
    readonly summonerId: string,
    readonly summonerRegion: keyof typeof regionalURLs
  ) {}

  async fetchFromCache() {
    return (await LuxannaStore.getInstance().get(
      `league:${this.summonerId}`
    )) as {
      RANKED_SOLO_5x5?: League;
      RANKED_FLEX_SR?: League;
      RANKED_TFT?: League | null;
    } | null;
  }

  async getSoloQueue() {
    const cached = await this.fetchFromCache();
    if (cached) {
      this.RANKED_SOLO_5x5 = cached.RANKED_SOLO_5x5;
    }

    if (!this.RANKED_SOLO_5x5) await this.fetchSummonerLeague();
    return this.RANKED_SOLO_5x5!;
  }

  async getFlexQueue() {
    const cached = await this.fetchFromCache();
    if (cached) {
      this.RANKED_FLEX_SR = cached.RANKED_FLEX_SR;
    }

    if (!this.RANKED_FLEX_SR) await this.fetchSummonerLeague();
    return this.RANKED_FLEX_SR!;
  }

  async getTFTQueue() {
    const cached = await this.fetchFromCache();
    if (cached) {
      this.RANKED_TFT = cached.RANKED_TFT;
    }

    if (!this.RANKED_TFT) await this.fetchSummonerLeague();
    return this.RANKED_TFT;
  }

  async fetchSummonerLeague() {
    const { data: leagues } = await restClient.GET(
      "/lol/league/v4/entries/by-summoner/{encryptedSummonerId}",
      {
        params: {
          path: {
            encryptedSummonerId: this.summonerId,
          },
        },
        overwriteURL: selectRegion(this.summonerRegion),
      }
    );

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

    await LuxannaStore.getInstance().set(
      `league:${this.summonerId}`,
      {
        RANKED_SOLO_5x5: this.RANKED_SOLO_5x5,
        RANKED_FLEX_SR: this.RANKED_FLEX_SR,
        RANKED_TFT: this.RANKED_TFT,
      },
      {
        ex: 60 * 60 * 24,
      }
    );
  }
}
