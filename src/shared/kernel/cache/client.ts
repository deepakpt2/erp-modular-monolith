/**
 * Dragonfly/Redis Cache Client – industry standard cache for ERP
 * Used for number ranges, assignments, material master, company codes, etc.
 * Dragonfly is drop-in Redis replacement – faster, lower memory – same API
 * Features: get/set/del, TTL, invalidation on update, fallback to DB if cache miss
 * Env: REDIS_URL or DRAGONFLY_URL – e.g., redis://dragonfly:6379 or redis://localhost:6379
 * If not available, falls back to no-cache (direct DB) – safe for dev
 */

let redisClient: any = null;
let redisAvailable = false;

async function getRedis() {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL || process.env.DRAGONFLY_URL || 'redis://localhost:6379';
  
  try {
    // Dynamic import to avoid hard dependency – if redis not installed, use memory fallback
    const { createClient } = await import('redis').catch(() => ({ createClient: null as any }));
    
    if (!createClient) {
      console.log('Cache: redis package not installed – using memory fallback – install redis for production');
      return null;
    }
    
    const client = createClient({ url: redisUrl });
    client.on('error', (err: any) => {
      console.warn('Cache redis error:', err.message);
      redisAvailable = false;
    });
    
    await client.connect().catch((e: any) => {
      console.warn('Cache connect failed:', e.message, '– using DB directly');
      return null;
    });
    
    if (client.isOpen) {
      redisClient = client;
      redisAvailable = true;
      console.log('Cache: Connected to', redisUrl.includes('dragonfly') ? 'Dragonfly' : 'Redis', redisUrl);
      return client;
    }
    
    return null;
  } catch (e: any) {
    console.warn('Cache init failed:', e.message, '– using DB directly');
    return null;
  }
}

// In-memory fallback for dev without redis
const memoryCache = new Map<string, { value: any, expiresAt: number }>();

export async function cacheGet(key: string): Promise<any | null> {
  try {
    const client = await getRedis();
    if (client && redisAvailable) {
      const val = await client.get(key);
      if (val) {
        try { return JSON.parse(val); } catch { return val; }
      }
      return null;
    }
    
    // Memory fallback
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) memoryCache.delete(key);
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    const client = await getRedis();
    const serialized = JSON.stringify(value);
    
    if (client && redisAvailable) {
      await client.setEx(key, ttlSeconds, serialized);
      return;
    }
    
    // Memory fallback
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch (e: any) {
    console.warn('cacheSet failed:', e.message);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedis();
    if (client && redisAvailable) {
      await client.del(key);
      return;
    }
    memoryCache.delete(key);
  } catch {}
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const client = await getRedis();
    if (client && redisAvailable) {
      // For Redis, use SCAN to delete pattern – e.g., nr:*
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(keys);
      return;
    }
    
    // Memory fallback – delete keys starting with pattern without *
    const prefix = pattern.replace('*', '');
    for (const k of memoryCache.keys()) {
      if (k.startsWith(prefix)) memoryCache.delete(k);
    }
  } catch {}
}

// Industry standard cache keys
export const CacheKeys = {
  numberRange: (code: string) => `nr:${code}`,
  numberRangeAssignment: (objectType: string, key: string) => `nra:${objectType}:${key}`,
  numberRangeNext: (code: string, year?: number) => `nr_next:${code}:${year || 'NA'}`,
  material: (code: string) => `mat:${code}`,
  company: (code: string) => `comp:${code}`,
  facility: (code: string) => `fac:${code}`,
  allNumberRanges: () => `nr:all`,
  allAssignments: () => `nra:all`,
};

// Invalidate number range cache on update – must be called after current_number increment or to_number change
export async function invalidateNumberRangeCache(code?: string) {
  if (code) {
    await cacheDel(CacheKeys.numberRange(code));
    await cacheDelPattern(`nr_next:${code}:*`);
    await cacheDel(CacheKeys.allNumberRanges());
  } else {
    await cacheDelPattern('nr:*');
    await cacheDelPattern('nr_next:*');
    await cacheDel(CacheKeys.allNumberRanges());
  }
  await cacheDel(CacheKeys.allAssignments());
}

export async function invalidateMaterialCache(code?: string) {
  if (code) await cacheDel(CacheKeys.material(code));
  else await cacheDelPattern('mat:*');
}
