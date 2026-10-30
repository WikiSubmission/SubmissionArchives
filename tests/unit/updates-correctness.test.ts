import { hasUnverifiedSpeakerAttribution } from '../../src/lib/catalog/provenance';
import { ProvenanceSchema } from '../../src/lib/catalog/schemas';
import { getMatchHref, getMediaLink } from '../../src/lib/search/navigation';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findQueryMatch, normalizeSearchText, tokenizeForIndex } from '../../src/lib/search/queryMatch';
import { formatCitation } from '../../src/lib/citation';
import { withSearchParams } from '../../src/lib/search/links';
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

test('actual result navigation preserves PDF pages and timestamps', () => {
 assert.equal(getMatchHref({id:'book',type:'other'}, {page:7,start_time:0}, 'שלום'), '/library/book?q=%D7%A9%D7%9C%D7%95%D7%9D&page=7');
 assert.equal(getMatchHref({id:'appendix-1',type:'appendix'}, {page:2,start_time:0,label:'APPENDIX 1'}, ''), '/library/appendix-1?page=2');
 assert.equal(getMatchHref({id:'video-program/a title',type:'video-program'}, {start_time:12.9}, ''), '/media/video-program/a%20title?t=12');
 assert.equal(getMediaLink({id:'salat-booklet',type:'other'}, ''), '/library/salat-booklet');
 assert.equal(getMediaLink({id:'salat-booklet',type:'other',page:4}, 'prayer'), '/library/salat-booklet?q=prayer&page=4');
});

test('provenance validation and existing attribution cautions survive refactoring', () => {
 assert.equal(hasUnverifiedSpeakerAttribution({id:'a',type:'messenger-audio',primaryNumber:72}),true);
 assert.equal(hasUnverifiedSpeakerAttribution({id:'a',type:'messenger-audio',primaryNumber:71}),false);
 assert.equal(ProvenanceSchema.safeParse({verification:'invented'}).success,false);
 assert.equal(ProvenanceSchema.safeParse({dateKind:'uploaded',verification:'unknown'}).success,true);
});
