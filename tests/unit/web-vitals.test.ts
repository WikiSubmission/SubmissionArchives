import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWebVitalMetric } from '../../src/lib/webVitals';

test('accepts and sanitizes a supported Web Vital metric', () => {
  assert.deepEqual(
    parseWebVitalMetric({
      id: 'v4-123',
      name: 'LCP',
      value: 1234.5,
      rating: 'good',
      navigationType: 'navigate',
      attribution: { arbitrary: 'content is intentionally discarded' },
    }),
    {
      id: 'v4-123',
      name: 'LCP',
      value: 1234.5,
      rating: 'good',
      navigationType: 'navigate',
    },
  );
});

test('rejects unsupported, malformed, and non-finite metrics', () => {
  assert.equal(parseWebVitalMetric(null), null);
  assert.equal(parseWebVitalMetric({ id: '1', name: 'custom', value: 1 }), null);
  assert.equal(parseWebVitalMetric({ id: '1', name: 'CLS', value: Number.NaN }), null);
  assert.equal(parseWebVitalMetric({ id: '1', name: 'INP', value: -1 }), null);
  assert.equal(parseWebVitalMetric({ id: '1', name: 'FCP', value: 1, rating: 'excellent' }), null);
});
