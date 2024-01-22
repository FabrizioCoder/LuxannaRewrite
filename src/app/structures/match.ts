import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";
import { LuxannaStore } from "../managers/cacheManager";

export class SummonerMatches {
  private matches: string[] = [];

  constructor(
    readonly puuid: string,
    readonly summonerRegion: keyof typeof regionalURLs
  ) {}

  async fetchHistory(queue?: number) {
    if (!this.matches.length) await this.fetchMatchesId(queue);
    return this.matches;
  }

  fetchById(matchId: string) {
    return this.fetchMatch(matchId);
  }

  private async fetchMatchesId(queue?: number) {
    const { data: matches } = await restClient.GET(
      "/lol/match/v5/matches/by-puuid/{puuid}/ids",

      {
        params: {
          path: {
            puuid: this.puuid,
          },
          query: {
            count: 5,
            queue: queue ? queue : undefined,
          },
        },

        overwriteURL: selectRegion(this.summonerRegion, true),
      }
    );

    // console.log(matches)

    if (matches) {
      this.matches = matches;
    }
  }

  private async fetchMatch(matchId: string) {
    const cached = (await LuxannaStore.getInstance().get(
      `match:${matchId}`
    )) as components["schemas"]["match-v5.MatchDto"] | null;

    if (cached) return cached;

    const { data: match } = await restClient.GET(
      "/lol/match/v5/matches/{matchId}",
      {
        params: {
          path: {
            matchId: matchId,
          },
        },

        overwriteURL: selectRegion(this.summonerRegion, true),
      }
    );

    if (match) {
      await LuxannaStore.getInstance().set(`match:${matchId}`, match, {
        ex: 60 * 60 * 24,
      });
    }

    return match;
  }
}
