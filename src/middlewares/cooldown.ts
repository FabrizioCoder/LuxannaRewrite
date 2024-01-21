import { Snowflake } from "@biscuitland/common";
import { LimitedCollection, createMiddleware } from "biscuitjs";
import { Ratelimit } from "../utils/constants";

const cooldowns = new LimitedCollection<Snowflake, Ratelimit>({});

export default createMiddleware<void>(async (middle) => {
	const commandCooldown = middle.context.resolver.parent?.ratelimit;
	if (!commandCooldown) return middle.next();

	const commmandName = middle.context.resolver.fullCommandName;

	const id =
		commandCooldown.type === "channel"
			? middle.context.interaction.channel?.id ?? middle.context.author.id //dm channel (?)
			: middle.context.author.id;
	const key = `${id}:${commmandName}`;

	const currentCooldown = cooldowns.raw(key);
	if (!currentCooldown) {
		cooldowns.set(key, commandCooldown, commandCooldown.time);
		return middle.next();
	}

	const timeLeft = (currentCooldown.expireOn - Date.now()) / 1000;
	switch (commandCooldown.type) {
		case "user":
			await middle.context.interaction.editOrReply({
				content: middle.context.t.middleware.cooldown
					.user(timeLeft.toFixed(1))
					.get(),
				flags: 64,
			});
			middle.stop(new Error(`cooldown (user: ${id})`));
			break;
		case "channel":
			await middle.context.interaction.editOrReply({
				content: middle.context.t.middleware.cooldown
					.channel(timeLeft.toFixed(1))
					.get(),
				flags: 64,
			});
			middle.stop(new Error(`cooldown (channel: ${id})`));
			break;
	}

	middle.next();
});
