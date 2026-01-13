
export interface MediaItem {
    type: 'youtube' | 'video' | 'book';
    url?: string;
    title: string;
    timestamp?: number; // Seconds
    citation?: string;
}

export interface StudyEntry {
    id: string;
    verse_ref: string; // "NT:Matthew:5:1"
    title?: string;
    content: string; // Markdown/HTML
    media_content: MediaItem[];
    cross_refs: string[];
}
