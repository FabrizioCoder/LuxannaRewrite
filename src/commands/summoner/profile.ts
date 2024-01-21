import {
	APIMessageComponentEmoji,
	ActionRow,
	Attachment,
	Button,
	ButtonStyle,
	CommandContext,
	ComponentsListener,
	Declare,
	MessageEmbed,
	MessageFlags,
	Options,
	SubCommand,
	resolveEmoji,
} from "biscuitjs";
import { EmbedColors, searchOptions } from "../../utils/constants";
import {
	calculateWinrate,
	capitalizeString,
	championEmoji,
	getChampionById,
	getChampionByName,
	getEmote,
	getQueueById,
	makeIconURL,
	parseSummonerOptions,
	rawEmote,
} from "../../utils/functions";
import { SummonersManager } from "../../app/managers/summonersManager";
import { components } from "../../lib/schema";
import { makeMasteryGraphic } from "../../utils/images/satori/mastery";
const noShowRank = ["CHALLENGER", "GRANDMASTER", "MASTER"];

@Declare({
	name: "profile",
	description: "Get the summoner profile",
})
@Options(searchOptions)
export default class RankedCommand extends SubCommand {
	async run(ctx: CommandContext<"client", typeof searchOptions>) {
		const embed = new MessageEmbed();
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
		const profileIconURL = makeIconURL("14.1.1", summoner.profileIconId);

		const basicInfoValue = [
			`\`Level:\` ${summoner.summonerLevel}`,
			`\`Platform:\` ${summoner.region.toUpperCase()}`,
			`\`Icon URL:\` [View here](${profileIconURL})`,
		];

		let soloQInfoValue: string[] = [
			`${getEmote("Unranked")} Unranked`,
			"└ **0W** / **0L**, 0% WR",
		];
		let flexInfoValue: string[] = [
			`${getEmote("Unranked")} Unranked`,
			"└ **0W** / **0L**, 0% WR",
		];

		const SummonerLeague = await summoner.getLeague();

		const soloQ = await SummonerLeague.getSoloQueue();
		const flex = await SummonerLeague.getFlexQueue();

		if (soloQ) {
			const tier = capitalizeString(soloQ.tier!.toLowerCase());
			soloQInfoValue = [
				// Tier
				`${getEmote(tier)} ${tier}${
					noShowRank.includes(soloQ.tier!) ? "" : ` ${soloQ.rank}`
				} (${soloQ.leaguePoints} LP)`,
				`└ **${soloQ.wins}W** / **${soloQ.losses}L**, ${calculateWinrate(
					soloQ.wins,
					soloQ.losses,
				)}% WR${soloQ.hotStreak ? " (\\🔥)" : ""}`,
			];
		}

		if (flex) {
			const tier = capitalizeString(flex.tier!.toLowerCase());
			flexInfoValue = [
				// Tier
				`${getEmote(tier)} ${tier}${
					noShowRank.includes(flex.tier!) ? "" : ` ${flex.rank}`
				} (${flex.leaguePoints} LP)`,
				`└ **${flex.wins}W** / **${flex.losses}L**, ${calculateWinrate(
					flex.wins,
					flex.losses,
				)}% WR${flex.hotStreak ? " (\\🔥)" : ""}`,
			];
		}

		// Highest Mastery
		const SummonerMastery = await summoner.getMastery();
		const highestMastery = await SummonerMastery.fetchTop(5);
		let bufferGraphic: Buffer | undefined = undefined;
		let highestMasteryValue = [];
		if (highestMastery?.length) {
			let values: {
				champion: string;
				score: number;
			}[] = [];

			for (const mastery of highestMastery) {
				const champion = getChampionById({ key: String(mastery.championId) })!;
				const championEmote = championEmoji(champion.id);
				const formatTime = `<t:${Math.floor(mastery.lastPlayTime / 1000)}:R>`;
				highestMasteryValue.push(
					[
						`${getEmote(`${mastery.championLevel}_`)} ${championEmote} **${
							champion.name
						}**`,
						`└ ${mastery.championPoints.toLocaleString()} pts (${formatTime})`,
					].join("\n"),
				);
				values.push({
					champion: champion.name,
					score: mastery.championPoints,
				});
			}
			bufferGraphic = await makeMasteryGraphic(values);
			embed.setImage("attachment://mastery.png");
		}

		//Recent Games
		const SummonerMatches = await summoner.getMatches();
		const recentGames = await SummonerMatches.fetchHistory();
		let recentGamesValue = [];

		if (recentGames.length) {
			let data: components["schemas"]["match-v5.ParticipantDto"];
			for (const id of recentGames) {
				const match = await SummonerMatches.fetchById(id);

				if (match) {
					for (const participant of match.info.participants) {
						if (participant.puuid === summoner.puuid) {
							data = participant;
						}
					}
				}

				const champion = getChampionByName({ name: data!.championName })!;

				const queue = getQueueById(match!.info.queueId);

				const championEmote = championEmoji(champion.id);

				const formatKDA = `${data!.kills}/${data!.deaths}/${data!.assists}, ${
					data!.totalMinionsKilled + data!.neutralMinionsKilled
				} CS`;

				const formatTime = `<t:${Math.floor(
					(match?.info.gameStartTimestamp! / 1000 + data!.timePlayed) | 0,
				)}:R>`;

				recentGamesValue.push(
					[
						`${
							data!.teamEarlySurrendered ? "🔃" : data!.win ? "✅" : "❌"
						} ${championEmote} **${champion!.name}**, *${
							queue!.description || queue!.name || "Unknown queue"
						}*`,
						`└ ${formatKDA} (${formatTime})`,
					].join("\n"),
				);
			}
		}

		// Current Game
		const SummonerSpectator = await summoner.getSpectator();
		const currentGame = await SummonerSpectator.fetchActiveGame();
		const row = new ActionRow();
		if (currentGame) {
			const selfParticipant = currentGame.participants.filter(
				(p) => p.summonerId === summoner.id,
			)[0]!;

			const champion = getChampionById({
				key: String(selfParticipant.championId),
			})!;
			const championEmote = rawEmote(champion.id)!;

			const queue = getQueueById(currentGame.gameQueueConfigId!)!;

			const blueParticipants = await Promise.all(
				currentGame.participants
					.filter((p) => p.teamId === 100)
					.map(async (participant) => {
						const champion = getChampionById({
							key: String(participant.championId),
						})!;
						const championEmote = championEmoji(champion.id);

						return `${championEmote} ${champion.name}`;
					}),
			);

			const redParticipants = await Promise.all(
				currentGame.participants
					.filter((p) => p.teamId === 200)
					.map(async (participant) => {
						const champion = getChampionById({
							key: String(participant.championId),
						})!;
						const championEmote = championEmoji(champion.id);

						return `${championEmote} ${champion.name}`;
					}),
			);

			const embedCurrentGame = new MessageEmbed()
				.setAuthor({
					name: `${summoner.gameName}#${summoner.tagLine}`,
					iconUrl: profileIconURL,
				})
				.setTitle(
					queue.detailedDescription || queue.description || "Unknown queue",
				)
				.setColor(EmbedColors.BLUE)
				.addFields([
					{
						name: "Blue Team",
						value: blueParticipants.join("\n"),
						inline: true,
					},
					{
						name: "Red Team",
						value: redParticipants.join("\n"),
						inline: true,
					},
				]);

			row.addComponents([
				new Button({
					style: ButtonStyle.Primary,
					custom_id: "active_game",
					emoji: {
						name: championEmote.split(":")[0],
						id: championEmote.split(":")[1],
					},
					label: `Playing as ${champion.name} (${
						queue.description || queue.name || "Unknown queue"
					})`,
				}).run((i, stop) => {
					i.editOrReply({
						embeds: [embedCurrentGame],
						components: [],
						flags: MessageFlags.Ephemeral,
					});
					stop("clicked");
				}),
			]);
		}

		embed
			.setAuthor({
				name: `${summoner.gameName}#${summoner.tagLine}`,
				iconUrl: profileIconURL,
			})
			.setColor(EmbedColors.BLUE)
			.addFields([
				{
					name: "Basic Information",
					value: basicInfoValue.join("\n"),
					inline: true,
				},
				{
					name: "Ranked Solo/Duo",
					value: soloQInfoValue.join("\n"),
					inline: true,
				},
				{
					name: "Ranked Flex",
					value: flexInfoValue.join("\n"),
					inline: true,
				},
				{
					name: "Highest Mastery",
					value: highestMasteryValue.length
						? highestMasteryValue.join("\n")
						: "No mastery found",
					inline: true,
				},
				{
					name: "Recent Games",
					value: recentGamesValue.length
						? recentGamesValue.join("\n")
						: "No recent games",
					inline: true,
				},
			]);

		const componentsListener = new ComponentsListener({
			timeout: 30000,
			filter: (interaction) => {
				if (interaction.user.id !== ctx.author.id) {
					interaction.write({
						content: `⚠️ ${interaction.user.toString()}, you can't use this button.`,
						flags: MessageFlags.Ephemeral,
					});
					return false;
				}

				return true;
			},
			onStop: async (reason) => {
				if (reason === "timeout" || reason === "clicked") {
					await ctx.editOrReply({
						components: [],
					});
				}
			},
		});

		return ctx.editOrReply({
			embeds: [embed],
			files: bufferGraphic
				? [
						new Attachment()
							.setFile("buffer", bufferGraphic)
							.setName("mastery.png")
							.setDescription("Mastery graphic"),
				  ]
				: undefined,
			components: row.components.length ? componentsListener.addRows(row) : [],
		});
	}
}
