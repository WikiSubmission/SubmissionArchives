import { useState, useEffect, useCallback, useRef } from 'react';

export interface WatchHistoryItem {
    mediaId: string;
    progress: number;
    currentTime: number;
    timestamp: number;
    completed: boolean;
    title?: string;
    thumbnail?: string;
}

export function useWatchHistory(mediaId: string, duration: number, title?: string) {
    const [progress, setProgress] = useState(0);
    const [lastWatched, setLastWatched] = useState<number | null>(null);
    // const updateInterval = useRef<NodeJS.Timeout | null>(null); // Not utilizing interval currently, but nice to have if needed

    // Load saved progress
    useEffect(() => {
        if (!mediaId) return;
        const saved = localStorage.getItem(`progress-${mediaId}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setProgress(data.progress);
                setLastWatched(data.currentTime);
            } catch (e) {
                console.error("Failed to parse progress", e);
            }
        }
    }, [mediaId]);

    // Track in global history list
    const updateGlobalHistory = useCallback((id: string, data: Partial<WatchHistoryItem>) => {
        try {
            const history: WatchHistoryItem[] = JSON.parse(localStorage.getItem('watch-history') || '[]');
            const existingIdx = history.findIndex(h => h.mediaId === id);

            const entry: WatchHistoryItem = {
                mediaId: id,
                progress: data.progress || 0,
                currentTime: data.currentTime || 0,
                timestamp: Date.now(),
                completed: (data.progress || 0) > 95,
                title: title || history[existingIdx]?.title || 'Unknown Title',
                // thumbnail: getCurrentThumbnail() // Add this later if needed
            };

            if (existingIdx !== -1) {
                history[existingIdx] = entry;
            } else {
                history.unshift(entry);
            }

            // Keep only last 50 items
            localStorage.setItem('watch-history', JSON.stringify(history.slice(0, 50)));
        } catch (e) {
            console.error("Failed to update global history", e);
        }
    }, [title]);

    // Auto-save progress
    // Call this from onTimeUpdate or periodically
    const saveProgress = useCallback((currentTime: number) => {
        if (!duration || duration === 0) return;

        const progressPercent = (currentTime / duration) * 100;
        const data = {
            progress: progressPercent,
            currentTime,
            timestamp: Date.now(),
            completed: progressPercent > 95
        };

        localStorage.setItem(`progress-${mediaId}`, JSON.stringify(data));
        setProgress(progressPercent);

        // Also save to global history
        updateGlobalHistory(mediaId, data);
    }, [mediaId, duration, updateGlobalHistory]);

    return { progress, lastWatched, saveProgress };
}
