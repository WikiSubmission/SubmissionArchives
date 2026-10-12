import { performance } from 'node:perf_hooks';
import { performSearch } from '../studio/src/lib/search';
const notes = Array.from({ length: 500 }, (_, i) => ({ path: `fixture/${i}.md`, name: `Synthetic note ${i}`, content: 'Shared archive evidence and research notes. '.repeat(30), tags: ['fixture'], links: [], modifiedMs: 0 }));
const start = performance.now(); const cold = performSearch(notes, 'shared archive');
const warm = performance.now(); performSearch(notes, 'shared archive');
console.log(JSON.stringify({ fixtureNotes: notes.length, matches: cold.length, coldIndexAndQueryMs: +(warm-start).toFixed(2), warmQueryMs: +(performance.now()-warm).toFixed(2) }));
