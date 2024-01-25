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
  commands: {
    errors: {
      noLinkedAccount: {
        self: "⚠️ You don't have a linked account. Enter your RiotId and region or you can also link your account with `/account link`.",
        user: "⚠️ This user doesn't have a linked account. Enter the RiotId and region of the user you want to search for.",
      },
      noUserButton: (user: string) => {
        return `⚠️ ${user}, you can't use this button.`;
      },
    },
    mastery: {
      errors: {
        noData: '⚠️ Summoner has no mastery.',
      },
      baseEmbed: {
        title: (totalPoints: number) =>
          `Champion Mastery (${totalPoints.toLocaleString()} pts)`,
        footer: (name: string) => `Requested by ${name}`,
      },
      embed: {
        fields: {
          championAndPoints: 'Champion & Points',
          lastPlayed: 'Last Played',
          chestGranted: 'Chest Granted',
        },
      },
    },
  },
};
