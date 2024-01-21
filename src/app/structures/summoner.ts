import { restClient } from "../../lib/rest";
import { components } from "../../lib/schema";
import { regionalURLs, selectRegion } from "../../utils/functions";
import { SummonerLeague } from "./league";
import { SummonerMastery } from "./mastery";
import { SummonerMatches } from "./match";
import { SummonerSpectator } from "./spectator";

/**
 * A representation of a RIOT account.
 */
export class Summoner {
	public league?: SummonerLeague;
	public match?: SummonerMatches;
	public mastery?: SummonerMastery;
	public spectator?: SummonerSpectator;
	public id: string;
	public summonerLevel: number;
	public profileIconId: number;
	public name: string;
	public accountId: string;

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
		this.accountId = summonerData.accountId;
	}

	async getLeague(): Promise<SummonerLeague> {
		if (!this.league) this.league = new SummonerLeague(this.id, this.region);
		return this.league!;
	}

	async getMatches() {
		if (!this.match) this.match = new SummonerMatches(this.puuid, this.region);
		return this.match!;
	}

	async getMastery() {
		if (!this.mastery)
			this.mastery = new SummonerMastery(this.puuid, this.region);
		return this.mastery!;
	}

	async getSpectator() {
		if (!this.spectator)
			this.spectator = new SummonerSpectator(this.id, this.region);
		return this.spectator!;
	}

	// Util Methods
	public static async fetchByRiotId(
		gameName: string,
		tagLine: string,
		region: keyof typeof regionalURLs,
	) {
		const { data: account } = await restClient.GET(
			"/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}",
			{
				params: {
					path: {
						gameName: gameName,
						tagLine: tagLine,
					},
				},
				overwriteURL: selectRegion(region, true),
			},
		);
		if (!account) return null;
		return account.puuid;
	}

	public static async fetchById(id: string, region: keyof typeof regionalURLs) {
		const { data: summoner } = await restClient.GET(
			"/lol/summoner/v4/summoners/{encryptedSummonerId}",
			{
				params: {
					path: {
						encryptedSummonerId: id,
					},
				},
				overwriteURL: selectRegion(region),
			},
		);

		if (!summoner) return null;
		return summoner;
	}

	public static async fetchData(
		puuid: string,
		region: keyof typeof regionalURLs,
	) {
		const { data: summoner } = await restClient.GET(
			"/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}",
			{
				params: {
					path: {
						encryptedPUUID: puuid,
					},
				},
				overwriteURL: selectRegion(region),
			},
		);

		if (!summoner) return null;
		return summoner;
	}
}
