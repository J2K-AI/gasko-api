import { CacheRepository } from '../../../core/domain/ports/CacheRepository';

export class KVCacheRepository implements CacheRepository {
  constructor(private readonly kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.kv.get(key, 'text');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
