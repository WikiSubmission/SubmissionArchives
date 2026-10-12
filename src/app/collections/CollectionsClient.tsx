"use client";
import { useEffect, useState } from 'react';
import { COLLECTIONS_KEY, emptyCollections, exportBibtex, exportMarkdown, parseCollections, saveCollections, type CollectionStore } from '@/lib/research/collections';
function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function CollectionsClient() {
    const [store, setStore] = useState<CollectionStore>(emptyCollections), [error, setError] = useState(''), [name, setName] = useState(''), [ready, setReady] = useState(false);
    useEffect(() => {
        function load() { try { setStore(parseCollections(localStorage.getItem(COLLECTIONS_KEY))); setError(''); setReady(true); } catch { setError('Stored data is unreadable. Download the original JSON to repair it, or import a valid backup.'); } }
        load(); window.addEventListener('storage', load); return () => window.removeEventListener('storage', load);
    }, []);
    function update(next: CollectionStore) { try { saveCollections(next, localStorage); setStore(next); setError(''); setReady(true); } catch (e) { setError(String(e)); } }
    return <main id="main-content" className="research-page">
        <p className="text-ed-fg-secondary">Your reading desk</p><h1>Research collections</h1>
        <p>Keep short references across the archive. Collections stay in this browser. Export a backup before clearing browser data.</p>
        <div className="research-controls">
            <input aria-label="New collection name" value={name} maxLength={100} onChange={e => setName(e.target.value)} />
            <button disabled={!ready || !name.trim()} onClick={() => { update({ ...store, collections: [...store.collections, { id: crypto.randomUUID(), name: name.trim(), entries: [] }] }); setName(''); }}>Create collection</button>
            <button disabled={!ready} onClick={() => download('research.md', exportMarkdown(store), 'text/markdown;charset=utf-8')}>Export Markdown</button>
            <button disabled={!ready || !exportBibtex(store)} onClick={() => download('research.bib', exportBibtex(store), 'text/plain;charset=utf-8')}>Export BibTeX</button>
            <button onClick={() => download('research.json' , localStorage.getItem(COLLECTIONS_KEY) ?? JSON.stringify(store), 'application/json')}>Export JSON</button>
            <label>Import JSON <input type="file" accept="application/json,.json" onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return;
                try { if (file.size > 2_000_000) throw new Error('File exceeds 2 MB.'); const imported = parseCollections(await file.text());
                    // Merge without replacing current references; new IDs avoid imported collisions.
                    update({ version: 1, collections: [...store.collections, ...imported.collections.map(c => ({ ...c, id: crypto.randomUUID() }))] });
                } catch (err) { setError(String(err)); } e.target.value = '';
            }} /></label>
        </div>
        {error && <p role="alert">{error}</p>}
        {!store.collections.length && <p>Save a verse, transcript excerpt, PDF page or editorial to start a collection.</p>}
        {store.collections.map((c, index) => <section key={c.id} className="py-6 border-t border-ed-rule">
            <label>Collection name <input aria-label={`Rename ${c.name}`} defaultValue={c.name} maxLength={100} onBlur={e => { if (e.target.value.trim()) update({ ...store, collections: store.collections.map(v => v.id === c.id ? { ...v, name: e.target.value.trim() } : v) }); }} /></label>
            <div className="research-controls"><button disabled={index === 0} onClick={() => { const list = [...store.collections]; [list[index-1], list[index]] = [list[index], list[index-1]]; update({ ...store, collections: list }); }}>Move collection up</button>
            <details><summary>Delete collection</summary><p>Remove this collection and its saved references?</p><button onClick={() => update({ ...store, collections: store.collections.filter(v => v.id !== c.id) })}>Confirm delete {c.name}</button></details></div>
            {!c.entries.length && <p>No references yet. Find a source in <a href="/search">archive search</a>.</p>}
            {c.entries.map((entry, i) => <article key={entry.id}><h2>{entry.title}</h2><p>{entry.kind} · {entry.locator}</p>{entry.excerpt && <blockquote dir="auto">{entry.excerpt}</blockquote>}
                <p>{entry.provenance}</p><a href={entry.url}>Open original</a>
                <div className="research-controls"><button disabled={i === 0} onClick={() => { const entries = [...c.entries]; [entries[i-1], entries[i]] = [entries[i], entries[i-1]]; update({ ...store, collections: store.collections.map(v => v.id === c.id ? { ...v, entries } : v) }); }}>Move reference up</button>
                <button onClick={() => update({ ...store, collections: store.collections.map(v => v.id === c.id ? { ...v, entries: v.entries.filter(item => item.id !== entry.id) } : v) })}>Remove reference</button></div>
            </article>)}
        </section>)}
    </main>;
}
