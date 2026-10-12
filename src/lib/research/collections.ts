import { z } from 'zod';
export const COLLECTIONS_KEY = 'sa:research-collections:v1';
const localUrl = z.string().max(2048).refine(value => /^\/(?!\/)/.test(value) && !value.includes('\\') && !/[\u0000-\u001f]/.test(value), 'Use a local archive link');
export const EntrySchema = z.object({
    id: z.string().max(300), sourceId: z.string().max(300), kind: z.enum(['quran', 'media', 'pdf', 'editorial']),
    title: z.string().min(1).max(500), url: localUrl, excerpt: z.string().max(600).default(''),
    bibliography: z.object({ title: z.string().max(500), authors: z.array(z.string().max(200)).max(20).optional(), year: z.number().int().positive().optional(), edition: z.string().max(100).optional(), publisher: z.string().max(500).optional(), url: z.string().url().max(2048), printedPage: z.string().max(100).optional() }).optional(),
    locator: z.string().max(100).optional(), provenance: z.string().max(600).optional(),
});
export const CollectionsSchema = z.object({ version: z.literal(1), collections: z.array(z.object({
    id: z.string().min(1).max(100), name: z.string().trim().min(1).max(100), entries: z.array(EntrySchema).max(500),
})).max(30) });
export type ResearchEntry = z.infer<typeof EntrySchema>;
export type CollectionStore = z.infer<typeof CollectionsSchema>;
export const emptyCollections = (): CollectionStore => ({ version: 1, collections: [] });
export function parseCollections(raw: string | null): CollectionStore {
    if (!raw) return emptyCollections();
    if (raw.length > 2_000_000) throw new Error('Collection file exceeds 2 MB.');
    const store = CollectionsSchema.parse(JSON.parse(raw));
    if (new Set(store.collections.map(c => c.id)).size !== store.collections.length) throw new Error('Duplicate collection identifiers.');
    for (const collection of store.collections) {
        if (new Set(collection.entries.map(e => e.id)).size !== collection.entries.length) throw new Error('Duplicate reference identifiers.');
    }
    return store;
}
export function saveCollections(store: CollectionStore, storage: Pick<Storage, 'setItem'>) {
    const raw = JSON.stringify(CollectionsSchema.parse(store));
    if (raw.length > 2_000_000) throw new Error('Collections exceed 2 MB. Export or remove some references.');
    storage.setItem(COLLECTIONS_KEY, raw);
}
export function addEntry(store: CollectionStore, collectionId: string, entry: ResearchEntry): CollectionStore {
    const valid = EntrySchema.parse(entry);
    if (!store.collections.some(c => c.id === collectionId)) throw new Error('Collection does not exist.');
    return CollectionsSchema.parse({ ...store, collections: store.collections.map(c => {
        if (c.id !== collectionId || c.entries.some(e => referenceKey(e) === referenceKey(valid))) return c;
        const ids = new Set(c.entries.map(e => e.id));
        let id = valid.id, suffix = 1;
        while (ids.has(id)) id = `${valid.id.slice(0, 280)}:${suffix++}`;
        return { ...c, entries: [...c.entries, { ...valid, id }] };
    }) });
}
const escapeMarkdown = (text: string) => text.replace(/[\\`*_[\]<>]/g, char => '\\' + char).replace(/\r?\n/g, ' ');
export function exportMarkdown(store: CollectionStore) {
    return store.collections.map(c => `# ${escapeMarkdown(c.name)}\n\n` + c.entries.map(e =>
        `## ${escapeMarkdown(e.title)}\n\n${e.kind}${e.locator ? ' · ' + escapeMarkdown(e.locator) : ''}\n\n` +
        (e.excerpt ? `> ${escapeMarkdown(e.excerpt)}\n\n` : '') +
        `[Open original](${markdownHref(e.url)})\n` +
        (e.provenance ? `\nSource context: ${escapeMarkdown(e.provenance)}\n` : '')).join('\n')).join('\n');
}

function markdownHref(href: string) {
    const url = new URL(href, 'https://archive.invalid');
    return (url.pathname + url.search + url.hash).replace(/[()]/g, char => char === '(' ? '%28' : '%29');
}

function referenceKey(entry: ResearchEntry) {
    const url = new URL(entry.url, 'https://archive.invalid');
    url.searchParams.delete('q'); url.searchParams.delete('highlight');
    if (entry.kind === 'quran') {
        if (!url.searchParams.has('edition')) url.searchParams.set('edition', '1992');
        if (url.searchParams.has('page')) url.hash = '';
    }
    url.searchParams.sort();
    return `${entry.kind}:${url.pathname}${url.search}${url.hash}`;
}

export function exportBibtex(store: CollectionStore) {
    const entries = store.collections.flatMap(c => c.entries).filter(e => e.bibliography && (e.bibliography.authors?.length || e.bibliography.year || e.bibliography.publisher));
    const escape = (text: string) => text.replace(/[\\{}%&#_$]/g, char => char === '\\' ? '\\textbackslash{}' : '\\' + char).replace(/\r?\n/g, ' ');
    return entries.map((entry, index) => {
        const b = entry.bibliography!;
        const fields: [string, string | undefined][] = [
            ['title', b.title], ['author', b.authors?.join(' and ')], ['year', b.year?.toString()],
            ['edition', b.edition], ['publisher', b.publisher], ['url', b.url],
            ['note', [entry.locator, (!b.year || !b.authors?.length) ? 'Incomplete bibliographic metadata; consult the source' : undefined].filter(Boolean).join('; ')],
        ];
        return `@misc{sa_reference_${index+1},\n` + fields.filter(([,value]) => value).map(([key,value]) => `  ${key} = {${escape(value!)}},`).join('\n') + '\n}';
    }).join('\n\n');
}
