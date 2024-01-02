import { Redis } from 'ioredis';

export class LuxannaStore {
    private adapter: Redis;

    constructor(adapter: Redis) {
        this.adapter = adapter;
    }

    async get(id: string): Promise<any | null> {
        const kv = await this.adapter.get(this.hashId(id));

        return kv ? JSON.parse(kv as string) : null;
    }
    async set(id: string, data: any, options: Options): Promise<void> {
        await this.adapter.set(this.hashId(id), JSON.stringify(data), 'EX', options.ex);
    }
    async exists(id: string): Promise<boolean> {
        return (await this.adapter.exists(this.hashId(id))) === 1;
    }
    private hashId(id: string): string {
        return `lux:${id}`;
    }
}

interface Options {
    ex: number;
}