import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
    id: number;
    time: number;
    note: string;
    color: string;
    timestamp: string;
    segmentText?: string;
}

export function useBookmarks(mediaId: string) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

    useEffect(() => {
        if (!mediaId) return;
        const saved = localStorage.getItem(`bookmarks-${mediaId}`);
        if (saved) {
            try {
                setBookmarks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse bookmarks", e);
            }
        } else {
            setBookmarks([]);
        }
    }, [mediaId]);

    const addBookmark = useCallback((time: number, note: string = '', color: string = 'yellow', segmentText: string = '') => {
        const bookmark: Bookmark = {
            id: Date.now(),
            time,
            note,
            color,
            timestamp: new Date().toISOString(),
            segmentText // Capture context
        };

        setBookmarks(prev => {
            const updated = [...prev, bookmark].sort((a, b) => a.time - b.time);
            localStorage.setItem(`bookmarks-${mediaId}`, JSON.stringify(updated));
            return updated;
        });
    }, [mediaId]);

    const deleteBookmark = useCallback((id: number) => {
        setBookmarks(prev => {
            const updated = prev.filter(b => b.id !== id);
            localStorage.setItem(`bookmarks-${mediaId}`, JSON.stringify(updated));
            return updated;
        });
    }, [mediaId]);

    const exportBookmarks = useCallback((title: string) => {
        const text = bookmarks.map(b =>
            `[${formatTime(b.time)}] ${b.note}\n"${b.segmentText || ''}"\n`
        ).join('\n---\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}-bookmarks.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [bookmarks]);

    return { bookmarks, addBookmark, deleteBookmark, exportBookmarks };
}

function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
