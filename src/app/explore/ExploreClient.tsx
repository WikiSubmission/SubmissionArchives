"use client";
import { useState } from 'react';
import type { DiscoveryRecord } from '@/lib/research/discovery';
export default function ExploreClient({ records }: { records: DiscoveryRecord[] }) {
    const [kind, setKind] = useState(''), [topic, setTopic] = useState(''), [year, setYear] = useState(''), [page, setPage] = useState(0), [undated, setUndated] = useState(false);
    const filtered = records.filter(r => (undated || r.year !== undefined) && (!kind || r.kind === kind) && (!topic || r.topics.includes(topic)) && (!year || String(r.year) === year));
    const kinds = [...new Set(records.map(r => r.kind))].sort(), topics = [...new Set(records.flatMap(r => r.topics))].sort(), years = [...new Set(records.flatMap(r => r.year === undefined ? [] : [r.year]))].sort((a,b) => a-b);
    return <main id="main-content" className="research-page"><p className="text-ed-fg-secondary">Across the archive</p><h1>Timeline & topics</h1>
        <p>Browse catalog dates and a small curated subject crosswalk. Upload dates describe uploads; dates with unspecified kinds do not establish when a recording was made. Undated works are available below.</p>
        <div className="research-controls">
            <label>Format <select value={kind} onChange={e => { setKind(e.target.value); setPage(0); }}><option value="">All formats</option>{kinds.map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Subject <select value={topic} onChange={e => { setTopic(e.target.value); setPage(0); }}><option value="">All subjects</option>{topics.map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Year <select value={year} onChange={e => { setYear(e.target.value); setPage(0); }}><option value="">All years</option>{years.map(v => <option key={v}>{v}</option>)}</select></label>
            <label><input type="checkbox" checked={undated} onChange={e => { setUndated(e.target.checked); setPage(0); }} /> Include undated works</label>
        </div><p role="status">{filtered.length} records</p>
        {filtered.slice(page*30, (page+1)*30).map(r => <article key={r.id}><p className="text-ed-fg-secondary">{r.year ?? 'Undated'} · {r.year ? r.dateKind : 'Date unknown'} · {r.kind}</p><h2><a href={r.url}>{r.title}</a></h2>{r.topics.length > 0 && <p>{r.topics.join(' · ')}</p>}</article>)}
        {!filtered.length && <p>No catalog records match these filters. Try including undated works.</p>}
        <div className="research-controls"><button disabled={!page} onClick={() => setPage(page-1)}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*30 >= filtered.length} onClick={() => setPage(page+1)}>Next</button></div>
    </main>;
}
