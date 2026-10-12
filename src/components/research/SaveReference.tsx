"use client";
import { useState } from 'react';
import { addEntry, COLLECTIONS_KEY, parseCollections, saveCollections, type ResearchEntry } from '@/lib/research/collections';
export default function SaveReference({ entry }: { entry: ResearchEntry }) {
    const [open, setOpen] = useState(false), [name, setName] = useState('Research'), [message, setMessage] = useState('');
    const [names, setNames] = useState<string[]>([]);
    function prepare() {
        try { setNames(parseCollections(localStorage.getItem(COLLECTIONS_KEY)).collections.map(c => c.name)); setOpen(!open); }
        catch { setMessage('Stored collections could not be read. Export and repair them in Collections before saving.'); }
    }
    function save() {
        try {
            let store = parseCollections(localStorage.getItem(COLLECTIONS_KEY));
            const trimmed = name.trim(); if (!trimmed) throw new Error('Enter a collection name.');
            let collection = store.collections.find(c => c.name === trimmed);
            if (!collection) { collection = { id: crypto.randomUUID(), name: trimmed, entries: [] }; store = { ...store, collections: [...store.collections, collection] }; }
            saveCollections(addEntry(store, collection.id, { ...entry, excerpt: entry.excerpt.slice(0, 600) }), localStorage);
            setMessage(`Saved to ${trimmed}.`); setOpen(false);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.'); }
    }
    return <span onClick={event => event.stopPropagation()}>
        <button className="research-save" type="button" aria-expanded={open} onClick={prepare}>Save</button>
        {open && <span className="inline-flex flex-wrap gap-2 p-2"><label>Collection <input className="min-h-11 max-w-[14rem] rounded border border-ed-rule bg-ed-bg px-2 text-ed-fg" aria-label="Collection name" value={name} maxLength={100} onChange={e => setName(e.target.value)} /></label>
            {names.length > 0 && <select className="min-h-11 max-w-[14rem] rounded border border-ed-rule bg-ed-bg px-2 text-ed-fg" aria-label="Existing collection" value={names.includes(name) ? name : ''} onChange={e => setName(e.target.value)}><option value="">Choose collection</option>{names.map(n => <option key={n}>{n}</option>)}</select>}
            <button className="research-save" type="button" onClick={save}>Save reference</button><a href="/collections">Collections</a></span>}
        <span role="status" className="text-xs">{message}</span>
    </span>;
}
