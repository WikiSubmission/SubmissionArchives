import { expect, test } from '@playwright/test';

// Guards the inverted-index pre-filter in searchIndex.ts. Two things can regress here:
// the speed win, and — more dangerously — its correctness, since the pre-filter must be a
// superset of what findQueryMatch would have matched on a full scan.
test.describe('search performance', () => {
    test('distinct queries stay well under the 200ms target', async ({ request }) => {
        // Distinct terms on purpose: repeating a query only measures the 5-minute LRU.
        // Steady-state latency is what this guards. The very first query after a cold boot
        // also pays a one-time index parse, so it is warmed explicitly rather than left to
        // whichever spec happens to run first.
        await request.get('/api/search?q=warmup&limit=1');

        const queries = ['mosque', 'charity', 'covenant', 'angels', 'scripture'];
        const timings: Array<{ query: string; ms: number }> = [];

        for (const query of queries) {
            const started = Date.now();
            const response = await request.get(`/api/search?q=${query}&limit=10`);
            timings.push({ query, ms: Date.now() - started });
            expect(response.status()).toBe(200);
        }

        for (const { query, ms } of timings) {
            expect(ms, `"${query}" took ${ms}ms`).toBeLessThan(200);
        }
    });

    test('substring matches survive the pre-filter', async ({ request }) => {
        // The invariant, not a corpus count: findQueryMatch matches substrings, so a
        // search for "miracle" must also reach segments containing only "miracles".
        // An exact-token pre-filter breaks that, and it is asserted as a relationship so
        // the test survives the corpus changing.
        const singular = await request.get('/api/search?q=miracle&limit=1');
        const plural = await request.get('/api/search?q=miracles&limit=1');

        const singularTotal = (await singular.json()).total;
        const pluralTotal = (await plural.json()).total;

        expect(pluralTotal).toBeGreaterThan(0);
        expect(singularTotal).toBeGreaterThanOrEqual(pluralTotal);
    });
});
