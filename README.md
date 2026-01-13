# RK Media Platform

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Search System

The platform features a high-performance, client-side search engine for the Submitter's Perspective newsletter archive.

### Architecture

- **Pre-computed Index**: An inverted index is generated at build time (`scripts/build-search-index.ts`) to ensure O(1) lookups.
- **Client-Side Caching**: Search results are cached in memory (`src/lib/search/cache.ts`) for instant repeated queries.
- **Fuzzy Matching**: Uses n-gram generation (trigrams) to support typo-tolerant web searching.
- **Content Store**: Actual document content is separated from the index to minimize initial load time.

### Building the Index

The search index is automatically generated during the build process. You can also generate it manually:

```bash
npm run build:search
```

This will create:
- `public/data/newsletters/search-index-optimized.json` (~200KB)
- `public/data/newsletters/search-content.json` (~60KB)
- `public/data/newsletters/search-stats.json`

### Performance Metrics

- **Search Latency**: < 10ms for typical queries
- **Cache Hit**: < 1ms
- **Index Load**: < 50ms (async)

### Deployment

The `prebuild` script in `package.json` ensures the search index is fresh for every production deployment.
