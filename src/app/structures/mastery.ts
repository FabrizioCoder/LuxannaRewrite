import { restClient } from '../../lib/rest';
import { components } from '../../lib/schema';
import { regionalURLs, selectRegion } from '../../utils/functions';

type Schema = components['schemas']['champion-mastery-v4.ChampionMasteryDto'];
export class SummonerMastery {
  constructor(
    readonly puuid: string,
    readonly summonerRegion: keyof typeof regionalURLs
  ) {}

  async fetchAll(): Promise<Schema[] | undefined> {
    const { data: mastery } = await restClient.GET(
      '/lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}',
      {
        params: {
          path: {
            encryptedPUUID: this.puuid,
          },
        },
        overwriteURL: selectRegion(this.summonerRegion, true),
      }
    );

    return mastery;
  }

  async fetchTop(amount: number): Promise<Schema[] | undefined> {
    const { data: mastery } = await restClient.GET(
      '/lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/top',
      {
        params: {
          path: {
            encryptedPUUID: this.puuid,
          },
          query: {
            count: amount,
          },
        },
        overwriteURL: selectRegion(this.summonerRegion, false),
      }
    );

    return mastery;
  }
}
