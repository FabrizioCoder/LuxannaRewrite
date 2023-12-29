import { restClient } from '../../lib/rest';
import { regionalURLs, selectRegion } from '../../utils/functions';

export class SummonerMatches {
  private matches: string[] = [];

  constructor(readonly puuid: string, readonly summonerRegion: keyof typeof regionalURLs) { }

  async getMatchesHistory() {
    if (!this.matches.length) await this.fetchMatchesId();
    return this.matches;
  }

  getMatchById(matchId: string) {
    return this.fetchMatch(matchId);
  }

  private async fetchMatchesId() {
    const { data: matches } = await restClient.GET(
      '/lol/match/v5/matches/by-puuid/{puuid}/ids',
      {
        params: {
          path: {
            puuid: this.puuid,
          },
          query: {
            count: 20, // Fetch the last 20 matches
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
    const { data: match } = await restClient.GET(
      '/lol/match/v5/matches/{matchId}',
      {
        params: {
          path: {
            matchId: matchId,
          },
        },

        overwriteURL: selectRegion(this.summonerRegion, true),
      }
    );

    return match;
  }
}
