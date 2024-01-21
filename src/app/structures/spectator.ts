import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";

type Schema = components["schemas"]["spectator-v4.CurrentGameInfo"];
export class SummonerSpectator {
	constructor(
		readonly summonerId: string,
		readonly summonerRegion: keyof typeof regionalURLs,
	) {}

	async fetchActiveGame(): Promise<Schema | undefined> {
		const { data: currentGameInfo } = await restClient.GET(
			"/lol/spectator/v4/active-games/by-summoner/{encryptedSummonerId}",
			{
				params: {
					path: {
						encryptedSummonerId: this.summonerId,
					},
				},
				overwriteURL: selectRegion(this.summonerRegion, false),
			},
		);

		return currentGameInfo;
	}
}
