import { RateLimitStore } from '../rate-limit.guard';

/**
 * The Redis path deliberately does not run during the e2e suites — those stay
 * on the in-memory counter so parallel jest workers don't share one IP's
 * budget and exhaust the strict limit against each other. That leaves the
 * Redis branch, the one that matters in production, otherwise untested, so it
 * is exercised directly here.
 *
 * The Redis cases no-op when no Redis is reachable, so the suite still runs on
 * a machine without one rather than failing for the wrong reason.
 */
describe('RateLimitStore', () => {
  const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6379';

  const isReady = (s: RateLimitStore): boolean =>
    (s as unknown as { redis?: { status?: string } }).redis?.status === 'ready';

  const waitReady = async (s: RateLimitStore): Promise<boolean> => {
    for (let i = 0; i < 20; i++) {
      if (isReady(s)) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return isReady(s);
  };

  describe('in-memory', () => {
    let store: RateLimitStore;
    const prev = process.env.REDIS_URL;

    beforeAll(() => {
      delete process.env.REDIS_URL;
      store = new RateLimitStore();
    });

    afterAll(async () => {
      await store.onModuleDestroy();
      if (prev !== undefined) process.env.REDIS_URL = prev;
    });

    it('counts up within the window', async () => {
      const key = `mem:${Date.now()}`;
      expect((await store.increment(key, 60_000)).count).toBe(1);
      expect((await store.increment(key, 60_000)).count).toBe(2);
    });

    it('does not hand back a reference that mutates under the caller', async () => {
      const key = `mem-alias:${Date.now()}`;
      const first = await store.increment(key, 60_000);
      await store.increment(key, 60_000);
      expect(first.count).toBe(1);
    });

    it('starts a new window once the old one expires', async () => {
      const key = `mem-exp:${Date.now()}`;
      expect((await store.increment(key, 1)).count).toBe(1);
      await new Promise((r) => setTimeout(r, 15));
      expect((await store.increment(key, 60_000)).count).toBe(1);
    });

    it('reset clears the counter', async () => {
      const key = `mem-reset:${Date.now()}`;
      await store.increment(key, 60_000);
      await store.reset(key);
      expect((await store.increment(key, 60_000)).count).toBe(1);
    });
  });

  describe('redis-backed', () => {
    let store: RateLimitStore;
    let available = false;
    const prevUrl = process.env.REDIS_URL;
    const prevEnv = process.env.NODE_ENV;

    beforeAll(async () => {
      // The constructor skips Redis under NODE_ENV=test by design, so this
      // block has to look like a non-test process to reach that branch.
      process.env.NODE_ENV = 'development';
      process.env.REDIS_URL = REDIS_URL;
      store = new RateLimitStore();
      available = await waitReady(store);
    });

    afterAll(async () => {
      await store.onModuleDestroy();
      process.env.NODE_ENV = prevEnv;
      if (prevUrl !== undefined) process.env.REDIS_URL = prevUrl;
      else delete process.env.REDIS_URL;
    });

    it('counts up in Redis', async () => {
      if (!available) return;
      const key = `redis:${Date.now()}:${Math.random()}`;
      expect((await store.increment(key, 60_000)).count).toBe(1);
      expect((await store.increment(key, 60_000)).count).toBe(2);
    });

    it('shares the counter across instances, which is the whole point', async () => {
      if (!available) return;
      const key = `redis-shared:${Date.now()}:${Math.random()}`;
      await store.increment(key, 60_000);

      // A second instance stands in for another process or replica. The
      // in-memory store returned 1 here — which is why a deploy reset the
      // brute-force limit on login and two replicas doubled it.
      const other = new RateLimitStore();
      await waitReady(other);
      expect((await other.increment(key, 60_000)).count).toBe(2);
      await other.onModuleDestroy();
    });

    it('does not extend the window on later increments', async () => {
      if (!available) return;
      const key = `redis-ttl:${Date.now()}:${Math.random()}`;
      const first = await store.increment(key, 5_000);
      await new Promise((r) => setTimeout(r, 300));
      const second = await store.increment(key, 5_000);
      expect(second.resetAt).toBeLessThanOrEqual(first.resetAt + 50);
    });

    it('reset clears the Redis counter', async () => {
      if (!available) return;
      const key = `redis-reset:${Date.now()}:${Math.random()}`;
      await store.increment(key, 60_000);
      await store.reset(key);
      expect((await store.increment(key, 60_000)).count).toBe(1);
    });
  });
});
