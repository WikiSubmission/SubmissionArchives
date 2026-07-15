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

test('preserves legacy public content URLs after the folder migration', async () => {
    const redirects = await nextConfig.redirects!();

    assert.deepEqual(
        redirects.find((redirect) => redirect.source === '/content/books/:path*'),
        {
            source: '/content/books/:path*',
            destination: '/content/written/books/:path*',
            permanent: true,
        },
    );
    assert.deepEqual(
        redirects.find((redirect) => redirect.source.includes('appendix_:number')),
        {
            source: '/content/appendix/pdfs/appendix_:number(\\d+).pdf',
            destination: '/content/quran/organized_appendices/1992/appendix-:number.pdf',
            permanent: true,
        },
    );
});
