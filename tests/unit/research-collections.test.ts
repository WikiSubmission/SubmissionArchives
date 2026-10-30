import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, parseCollections, exportBibtex, exportMarkdown, saveCollections, type CollectionStore } from '../../src/lib/research/collections';
import { highlightSearchText } from '../../src/lib/search/highlight';
test('mixed-source collections serialize, deduplicate and safely export Unicode', () => {
 let store: CollectionStore = {version:1,collections:[{id:'desk',name:'Research [one]',entries:[]}]};
 for (const kind of ['pdf','media','quran','editorial'] as const) {
  const entry = {id:kind,sourceId:kind,kind,title:'أحمد <script>',url:'/library/a?page=2',excerpt:'שלום & text'};
  store = addEntry(store,'desk',entry); store = addEntry(store,'desk',entry);
 }
 assert.equal(store.collections[0].entries.length,4);
 assert.deepEqual(parseCollections(JSON.stringify(store)),store);
 assert.ok(exportMarkdown(store).includes('שלום'));
 assert.ok(exportMarkdown(store).includes('Research \\[one\\]'));
 assert.throws(()=>parseCollections('{broken'));
 assert.throws(()=>addEntry(store,'desk',{id:'x',sourceId:'x',kind:'pdf',title:'x',url:'//evil.test',excerpt:''}));
 assert.throws(()=>saveCollections(store,{setItem(){throw new Error('Quota exceeded')}}),/Quota/);
});
test('highlighting uses original marks and escapes HTML around matched evidence', () => {
 assert.equal(highlightSearchText('<b>שָׁלוֹם</b>','שלום'), '&lt;b&gt;<mark class="qs-highlight">שָׁלוֹם</mark>&lt;/b&gt;');
});

test('Markdown export preserves already encoded stable paths', () => {
 const store: CollectionStore = {version:1,collections:[{id:'a',name:'Quotes',entries:[{id:'q',sourceId:'q',kind:'media',title:'A title',url:'/media/QS%20One?t=19',excerpt:''}]}]};
 assert.ok(exportMarkdown(store).includes('/media/QS%20One?t=19'));
 assert.ok(!exportMarkdown(store).includes('%2520'));
});

test('edition references keep distinct IDs and query highlighting does not duplicate a verse', () => {
 let store: CollectionStore = {version:1,collections:[{id:'a',name:'Desk',entries:[]}]};
 const entry = {id:'page',sourceId:'appendix-1',kind:'pdf' as const,title:'Appendix',url:'/library/appendix-1?edition=1981&page=2',excerpt:''};
 store=addEntry(store,'a',entry);store=addEntry(store,'a',{...entry,url:'/library/appendix-1?edition=1989&page=2'});
 assert.equal(new Set(store.collections[0].entries.map(e=>e.id)).size,2);
 assert.deepEqual(parseCollections(JSON.stringify(store)),store);
 const verse = {id:'1:1',sourceId:'quran/1',kind:'quran' as const,title:'Quran 1:1',url:'/scripture/quran/1?page=1#verse-1',excerpt:''};
 store=addEntry(store,'a',verse);store=addEntry(store,'a',{...verse,url:'/scripture/quran/1?q=God&page=1&edition=1992'});
 assert.equal(store.collections[0].entries.length,3);
});

test('BibTeX exports only supplied bibliographic fields and marks missing dates', () => {
 const store: CollectionStore = {version:1,collections:[{id:'a',name:'Desk',entries:[{id:'b',sourceId:'b',kind:'pdf',title:'Book',url:'/library/b',excerpt:'',bibliography:{title:'A {title}',authors:['Rashad Khalifa'],url:'https://archive.wikisubmission.org/library/b'}}]}]};
 const bib=exportBibtex(store); assert.ok(bib.includes('Rashad Khalifa'));assert.ok(bib.includes('Incomplete bibliographic metadata'));
 assert.ok(!bib.includes('year ='));assert.ok(!bib.includes('publisher ='));assert.ok(bib.includes('A \\{title\\}'));
});
