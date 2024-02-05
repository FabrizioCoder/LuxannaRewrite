import { restClient } from '../../lib/rest';
import { components } from '../../lib/schema';
import { regionalURLs, selectRegion } from '../../utils/functions';
import { LuxannaStore } from '../managers/cacheManager';

type League = components['schemas']['league-v4.LeagueEntryDTO'];

export class SummonerLeague {
  // private RANKED_SOLO_5x5?: League;
  // private RANKED_FLEX_SR?: League;
  // private RANKED_TFT?: League | null;

  constructor(
    readonly summonerId: string,
    readonly summonerRegion: keyof typeof regionalURLs
  ) {}

  async fetchFromCache() {
    return (await LuxannaStore.getInstance().get(
      `league:${this.summonerId}`
    )) as League[] | null;
  }

  // async getSoloQueue() {
  //   const cached = await this.fetchFromCache();
  //   if (cached) {
  //     this.RANKED_SOLO_5x5 = cached.RANKED_SOLO_5x5;
  //   }

  //   if (!this.RANKED_SOLO_5x5) await this.fetchSummonerLeague();
  //   return this.RANKED_SOLO_5x5!;
  // }

  // async getFlexQueue() {
  //   const cached = await this.fetchFromCache();
  //   if (cached) {
  //     this.RANKED_FLEX_SR = cached.RANKED_FLEX_SR;
  //   }

  //   if (!this.RANKED_FLEX_SR) await this.fetchSummonerLeague();
  //   return this.RANKED_FLEX_SR!;
  // }

  // async getTFTQueue() {
  //   const cached = await this.fetchFromCache();
  //   if (cached) {
  //     this.RANKED_TFT = cached.RANKED_TFT;
  //   }

  //   if (!this.RANKED_TFT) await this.fetchSummonerLeague();
  //   return this.RANKED_TFT;
  // }

  async fetchSummonerLeague() {
    const cached = await this.fetchFromCache();
    if (cached) return cached;

    const { data: leagues } = await restClient.GET(
      '/lol/league/v4/entries/by-summoner/{encryptedSummonerId}',
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
      await LuxannaStore.getInstance().set(
        `league:${this.summonerId}`,
        leagues,
        {
          ex: 300,
        }
      );

      return leagues;
    }

    return null;
  }
}
