import assert from 'node:assert/strict';
import test from 'node:test';
import { checkRateLimit } from '../../src/lib/rateLimit';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('allows requests under the limit', () => {
    const key = `under-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(key, 5, 10_000);
        assert.equal(result.limited, false);
    }
});

test('blocks once a key exceeds the limit within a window', () => {
    const key = `over-${Date.now()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 10_000);
    const sixth = checkRateLimit(key, 5, 10_000);
    assert.equal(sixth.limited, true);
    assert.equal(sixth.remaining, 0);
    assert.ok(sixth.retryAfter >= 1);
});

test('two keys are independent — one tripping the limit does not affect the other', () => {
    const busy = `busy-${Date.now()}`;
    const quiet = `quiet-${Date.now()}`;
    for (let i = 0; i < 6; i++) checkRateLimit(busy, 5, 10_000);
    const busyResult = checkRateLimit(busy, 5, 10_000);
    const quietResult = checkRateLimit(quiet, 5, 10_000);
    assert.equal(busyResult.limited, true);
    assert.equal(quietResult.limited, false);
});

test('a full window fully elapsing clears the count, unlike a mid-window carry-over', async () => {
    const key = `elapsed-${Date.now()}`;
    const windowMs = 200;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, windowMs);
    assert.equal(checkRateLimit(key, 5, windowMs).limited, true);

    // Comfortably more than two full windows so no part of the busy window's count can
    // still be weighted in, even with scheduler jitter.
    await sleep(windowMs * 3);
    const afterGap = checkRateLimit(key, 5, windowMs);
    assert.equal(afterGap.limited, false);
});

test('a burst straight after a window boundary is still throttled, unlike a plain fixed window', async () => {
    // The defect a sliding window fixes: a fixed window lets a burst smuggle up to 2x the
    // limit through by spending the limit right before a boundary, then again right after.
    // windowMs is generous (not a tight few-ms margin) so the assertion is robust to
    // ordinary scheduler jitter rather than flaking under load.
    const key = `boundary-${Date.now()}`;
    const windowMs = 200;
    const limit = 5;

    for (let i = 0; i < limit; i++) checkRateLimit(key, limit, windowMs);
    // Six requests landed in the first window (five in the loop, one here).
    assert.equal(checkRateLimit(key, limit, windowMs).limited, true);

    // 10% into the next window: previousCount=6 carries in at ~90% weight, so the
    // weighted count (~6.4) is still comfortably over the limit. A fixed window would
    // have reset to 0 here and happily allowed 5 more requests immediately.
    await sleep(windowMs * 0.1 + 10);
    const justAfterBoundary = checkRateLimit(key, limit, windowMs);
    assert.equal(
        justAfterBoundary.limited,
        true,
        'the previous window\'s usage should still be weighted in this soon after the boundary',
    );
});
