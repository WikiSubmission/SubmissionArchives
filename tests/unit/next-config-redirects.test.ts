import assert from 'node:assert/strict';
import test from 'node:test';
import nextConfig from '../../next.config';

test('redirects /other to /written permanently', async () => {
    assert.equal(typeof nextConfig.redirects, 'function');

    const redirects = await nextConfig.redirects!();

    assert.deepEqual(
        redirects.find((redirect) => redirect.source === '/other'),
        { source: '/other', destination: '/written', permanent: true },
    );
});
