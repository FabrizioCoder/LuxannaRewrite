import {
	Client,
	IClients,
	OptionsRecord,
	MiddlewareContext,
	ParseLocales,
	UserCommandInteraction,
	MessageCommandInteraction,
} from "biscuitjs";
import { Ratelimit } from "../utils/constants";
import mongoose from "mongoose";
import "dotenv/config";
import type defaultLang from "../locales/en-US.ts";

export async function main() {
	const client = new Client();

	client.events.OnFail = async (...err) => console.error("error", ...err);

	await client.start();
	client.setServices({
		defaultLang: "en-US",
	});

	await mongoose.connect(process.env.MONGO_URI!, {
		dbName: "lux",
	});
}

declare module "biscuitjs" {
	interface Command {
		ratelimit: Ratelimit;
	}
	interface SubCommand {
		ratelimit: Ratelimit;
	}

	interface CommandContext<
		C extends keyof IClients,
		T extends OptionsRecord = {},
		M extends readonly MiddlewareContext[] = [],
	> {
		t: ParseLocales<typeof defaultLang>;
	}

	interface MenuCommandContext<
		C extends keyof IClients,
		T extends
		| UserCommandInteraction<boolean>
		| MessageCommandInteraction<boolean>,
		M extends readonly MiddlewareContext[] = [],
	> {
		t: ParseLocales<typeof defaultLang>;
	}
}
