import { Redis } from 'ioredis';

export class LuxannaStore {
  private adapter = new Redis("rediss://default:AdKuAAIncDFlYzA3OGU2NDljN2U0YTg5YjA1YzAzNzhmNWI2NDlmNXAxNTM5MzQ@lasting-marten-53934.upstash.io:6379");

  private static instance: LuxannaStore;

  public static getInstance(): LuxannaStore {
    if (!LuxannaStore.instance) {
      LuxannaStore.instance = new LuxannaStore();
    }
    return LuxannaStore.instance;
  }

  async get(id: string): Promise<any | null> {
    if (id.startsWith('link:')) {
      const link = await this.adapter.get(id);
      id = link as string;
    }

    const kv = await this.adapter.get(id);

    return kv ? JSON.parse(kv as string) : null;
  }
  async set(id: string, data: unknown, options: Options): Promise<void> {
    await this.adapter.set(id, JSON.stringify(data), 'EX', options.ex);
  }
  async exists(id: string): Promise<boolean> {
    return (await this.adapter.exists(id)) === 1;
  }

  async link(id: string, link: string): Promise<void> {
    await this.adapter.set(`link:${id}`, link, 'EX', 86);
  }
}

interface Options {
  ex: number;
}
