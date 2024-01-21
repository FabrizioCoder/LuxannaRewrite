export default {
	middleware: {
		cooldown: {
			user: (timeLeft: string) => {
				return `⚠️ You are on cooldown for **${timeLeft}** seconds.`;
			},
			channel: (timeLeft: string) => {
				return `⚠️ This channel is on cooldown for **${timeLeft}** seconds.`;
			},
		},
	},
};
