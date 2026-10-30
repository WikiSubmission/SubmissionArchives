// How the recordings archive is organized. Shared by the /media page, the home page and the
// player's breadcrumb so a recording always links back to the collection it is listed under.

export const COLLECTIONS = [
    { key: 'programs', label: 'Programs', format: 'Video' },
    { key: 'sermons', label: 'Friday Sermons', format: 'Video' },
    { key: 'lessons', label: 'Lessons', format: 'Video' },
    { key: 'debates', label: 'Debates & Conferences', format: 'Video' },
    { key: 'quran-studies', label: 'Quran Studies', format: 'Audio' },
    { key: 'messenger-audio', label: 'Messenger Audio', format: 'Audio' },
] as const;

export type Collection = (typeof COLLECTIONS)[number];
export type CollectionKey = Collection['key'];

export type Recording = {
    id: string;
    type: string;
    title: string;
    shortTitle: string;
    collection: CollectionKey;
    number?: string;
    date?: string;
    primaryNumber?: number;
    thumbnailOverride?: string;
    playUrl?: string;
};

// Videos share one record type, so their collection comes from the title.
function getVideoCollection(title: string): CollectionKey {
    const t = title.toLowerCase();
    if (t.includes('friday sermon') || t.includes('khutba')) return 'sermons';
    if (/debate|discussion|united submitters international conference|usi conference|fulfillment of the covenant/.test(t)) {
        return 'debates';
    }
    if (/essentials of submission|principles of contact prayers|principles of friday prayer|arabic language lessons/.test(t)) {
        return 'lessons';
    }
    return 'programs';
}

export function getCollection(record: { type: string; title: string }): Collection {
    const key = record.type === 'quran-study'
        ? 'quran-studies'
        : record.type === 'messenger-audio' || record.type === 'audio'
            ? 'messenger-audio'
            : getVideoCollection(record.title);
    return COLLECTIONS.find((collection) => collection.key === key)!;
}

export function getCollectionHref(key: CollectionKey): string {
    return `/media#${key}`;
}
