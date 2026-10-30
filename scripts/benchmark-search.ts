import { performance } from 'node:perf_hooks';
import { warmSearchIndex, runSearch } from '../src/lib/search/searchIndex';
const start = performance.now();
const records = warmSearchIndex();
console.log(JSON.stringify({records, coldMs: +(performance.now()-start).toFixed(2), heapMB: +(process.memoryUsage().heapUsed/1048576).toFixed(2)}));
for (const query of ['miracle', 'God', '"mathematical miracle"', 'الله', 'שלום']) {
 const t = performance.now(); const hits = runSearch(query, { limit: 10 });
 const warm = performance.now(); runSearch(query, { limit: 10 });
 console.log(JSON.stringify({query, records:hits.total, firstMs:+(warm-t).toFixed(2), cachedMs:+(performance.now()-warm).toFixed(2)}));
}
