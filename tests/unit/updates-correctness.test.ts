import { hasUnverifiedSpeakerAttribution } from '../../src/lib/catalog/provenance';
import { ProvenanceSchema } from '../../src/lib/catalog/schemas';
import { getMatchHref } from '../../src/lib/search/navigation';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findQueryMatch, normalizeSearchText, tokenizeForIndex } from '../../src/lib/search/queryMatch';
import { formatCitation } from '../../src/lib/citation';
import { withSearchParams } from '../../src/lib/search/links';
import { performSearch } from '../../studio/src/lib/search';
test('Unicode normalization shares indexing and preserves source offsets', () => {
 for (const [text, query] of [['أَحْمَدُ كتاب', 'أحمد'], ['שָׁלוֹם עולם', 'שלום'], ['Résumé truth', 'resume'], ['English كتاب', 'كتاب']]) {
  const hit = findQueryMatch(text, query); assert.equal(hit.matched, true);
  assert.ok(tokenizeForIndex(text).includes(normalizeSearchText(query)));
  assert.equal(normalizeSearchText(text.slice(hit.start, hit.end)), normalizeSearchText(query));
 }
 assert.equal(findQueryMatch('أَحْمَدُ', 'literal:أحمد').matched, false);
 assert.equal(findQueryMatch('أَحْمَدُ', 'literal:أَحْمَدُ').matched, true);
 assert.notEqual(normalizeSearchText('أحمد'), normalizeSearchText('احمد'));
});
test('citations retain known years and label scan pages', () => {
 assert.ok(!formatCitation({title: 'Work', authors: ['Dr. Rashad Khalifa'], url: '/library/work'}, 'apa', 2).includes('R..'));
 for (const year of [1974, 1989]) for (const style of ['apa', 'mla', 'chicago'] as const) {
  const text = formatCitation({title:'A work',year,url:'/library/a'}, style, 5);
  assert.ok(text.includes(String(year))); assert.ok(text.includes('PDF page 5')); assert.ok(text.includes('?page=5'));
 }
 assert.ok(formatCitation({title:'Unknown',url:'/library/a'}, 'apa').includes('n.d.'));
});
test('timestamp links preserve query, encoding and fragments', () => {
 assert.equal(withSearchParams('/media/a?q=hello%20world#transcript', {t:12}), '/media/a?q=hello+world&t=12#transcript');
 assert.equal(withSearchParams('/library/a?page=1', {page:7}), '/library/a?page=7');
});
test('Studio filters modified dates honestly and rejects invalid dates', () => {
 const notes = [{path:'a.md',name:'alpha',content:'body text',tags:[],links:[],modifiedMs:Date.parse('2026-01-10T12:00:00Z')},{path:'b.md',name:'beta',content:'other body',tags:[],links:[]}];
 assert.deepEqual(performSearch(notes, 'before:2026-01-11').map(r=>r.note.path), ['a.md']);
 assert.equal(performSearch(notes, 'after:2026-01-10').length, 0);
 assert.throws(()=>performSearch(notes, 'before:2026-02-30'), /Invalid date/);
 assert.equal(performSearch(notes, 'alpha')[0].snippet, 'body text');
});

test('actual result navigation preserves PDF pages, Quran editions and timestamps', () => {
 assert.equal(getMatchHref({id:'book',type:'other'}, {page:7,start_time:0}, 'שלום'), '/library/book?q=%D7%A9%D7%9C%D7%95%D7%9D&page=7');
 assert.equal(getMatchHref({id:'quran/1',type:'quran'}, {page:2,start_time:0,label:'verse-1989'}, ''), '/scripture/quran/1?edition=1989&page=2');
 assert.equal(getMatchHref({id:'video-program/a title',type:'video-program'}, {start_time:12.9}, ''), '/media/video-program/a%20title?t=12');
});

test('provenance validation and existing attribution cautions survive refactoring', () => {
 assert.equal(hasUnverifiedSpeakerAttribution({id:'a',type:'messenger-audio',primaryNumber:72}),true);
 assert.equal(hasUnverifiedSpeakerAttribution({id:'a',type:'messenger-audio',primaryNumber:71}),false);
 assert.equal(ProvenanceSchema.safeParse({verification:'invented'}).success,false);
 assert.equal(ProvenanceSchema.safeParse({dateKind:'uploaded',verification:'unknown'}).success,true);
});

test('split-pane drafts and serialized saves cannot acknowledge a newer edit', async () => {
 const { publishNoteDraft, getNoteDraft, acknowledgeNoteDraft, subscribeNoteDraft, queueNoteWrite, flushNoteWrites } = await import('../../studio/src/lib/saveQueue');
 const owner = {}, other = {}; const received: string[] = [];
 const unsubscribe = subscribeNoteDraft((path, draft) => { if (path === 'draft-test.md' && draft.owner !== other) received.push(draft.content); });
 const first = publishNoteDraft('draft-test.md', 'first', owner);
 const second = publishNoteDraft('draft-test.md', 'second', other);
 assert.deepEqual(received, ['first']);
 assert.equal(acknowledgeNoteDraft('draft-test.md', first.revision), false);
 assert.equal(getNoteDraft('draft-test.md')?.content, 'second');
 const writes: string[] = [];
 await Promise.all([queueNoteWrite('draft-test.md', async () => { await new Promise(resolve => setTimeout(resolve, 5)); writes.push('first'); }), queueNoteWrite('draft-test.md', async () => { writes.push('second'); })]);
 await flushNoteWrites(); assert.deepEqual(writes, ['first', 'second']);
 assert.equal(acknowledgeNoteDraft('draft-test.md', second.revision), true);
 assert.equal(getNoteDraft('draft-test.md'), undefined); unsubscribe();
});

test('graph neighborhoods include both directions without unrelated nodes', async () => {
 const { neighborhood, computeLayout } = await import('../../studio/src/lib/graph');
 const edges: [string, string][] = [['a', 'b'], ['c', 'a'], ['d', 'e']];
 assert.deepEqual(neighborhood(['a', 'b', 'c', 'd', 'e'], edges, 'a'), ['a', 'b', 'c']);
 const positions = computeLayout(['a', 'b'].map(id => ({ id, label: id, path: id })), [['a', 'b']], 800, 500);
 assert.equal(positions.length, 2); assert.ok(positions.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
});
