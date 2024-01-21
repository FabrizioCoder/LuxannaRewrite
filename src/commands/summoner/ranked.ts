import {
	Attachment,
	CommandContext,
	Declare,
	Options,
	SubCommand,
} from "biscuitjs";
import { SummonersManager } from "../../app/managers/summonersManager";
import { searchOptions } from "../../utils/constants";
import { parseSummonerOptions } from "../../utils/functions";
import { makeRankedProfile } from "../../utils/images/ranked";

@Declare({
	name: "ranked",
	description: "Get the summoner ranked stats",
})
@Options(searchOptions)
export default class RankedCommand extends SubCommand {
	async run(ctx: CommandContext<"client", typeof searchOptions>) {
		const args = await parseSummonerOptions({
			user: ctx.options.user,
			userId: ctx.author.id,
			riotId: ctx.options["riot-id"],
			region: ctx.options.region,
		});

		if (!args) {
			return ctx.editOrReply({
				content:
					"You don't have a linked account. Enter your RiotId and region or you can also link your account with `/account link`.",
			});
		}

		const [gameName, tagLine] = args.riotId.split("#");
		const summoner = await SummonersManager.getInstance(ctx.client).get(
			`${args.region}:${gameName}:${tagLine}`,
		);

		if (!summoner) {
			return ctx.editOrReply({
				content: "Summoner not found.",
			});
		}

		const SummonerRankeds = await summoner.getLeague();
		const img = await makeRankedProfile(SummonerRankeds, summoner);

		return ctx.editOrReply({
			content: `Ranked stats for **${gameName}#${tagLine}** (${args.region.toUpperCase()})`,
			files: [
				new Attachment()
					.setName("ranked.png")
					.setFile("buffer", img)
					.setDescription("Ranked stats"),
			],
		});
	}
}
