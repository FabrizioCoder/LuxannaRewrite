import createClient from "./fetch";
import type { paths } from "./schema";

const restClient = createClient<paths>({
  headers: {
    "X-Riot-Token": process.env.RIOT_API_KEY,
  },
});

export { restClient };
