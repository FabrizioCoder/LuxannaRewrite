import { restClient } from '../../lib/rest';
import { components } from '../../lib/schema';
import { regionalURLs, selectRegion } from '../../utils/functions';
import { LuxannaStore } from '../managers/cacheManager';

type Schema = components['schemas']['spectator-v4.CurrentGameInfo'];
export class SummonerSpectator {
  constructor(
    readonly summonerId: string,
    readonly summonerRegion: keyof typeof regionalURLs
  ) {}

  async fetchActiveGame(): Promise<Schema | undefined> {
    const cached = (await LuxannaStore.getInstance().get(
      `spectator:${this.summonerId}`
    )) as Schema | null;

    if (cached) return cached;

    const { data: currentGameInfo } = await restClient.GET(
      '/lol/spectator/v4/active-games/by-summoner/{encryptedSummonerId}',
      {
        params: {
          path: {
            encryptedSummonerId: this.summonerId,
          },
        },
        overwriteURL: selectRegion(this.summonerRegion, false),
      }
    );

    if (currentGameInfo) {
      await LuxannaStore.getInstance().set(
        `spectator:${this.summonerId}`,
        currentGameInfo,
        { ex: 90 }
      );
    }

    return currentGameInfo;
  }
}
