import { createClient } from 'redis';

class RedisService {
  private client: ReturnType<typeof createClient>;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.client.set(key, value, { EX: expireSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    const result = await this.client.hGetAll(key);
    return result as Record<string, string>;
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.client.hSet(key, field, value);
  }

  async hSetNX(key: string, field: string, value: string): Promise<number> {
    return this.client.hSetNX(key, field, value);
  }

  async hMSet(key: string, data: Record<string, string>): Promise<number> {
    return this.client.hSet(key, data);
  }

  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.client.zAdd(key, { score, value: member });
  }

  async zRange(key: string, min: number, max: number): Promise<string[]> {
    return this.client.zRange(key, min, max);
  }

  async sAdd(key: string, member: string): Promise<number> {
    return this.client.sAdd(key, member);
  }

  async sRem(key: string, member: string): Promise<number> {
    return this.client.sRem(key, member);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushAll(): Promise<string> {
    return this.client.flushAll();
  }
}

// Создаем и экспортируем экземпляр сервиса
export const redisService = new RedisService();
