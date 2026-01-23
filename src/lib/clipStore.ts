// Shared clip metadata store
// In production, replace with D1/database

export interface ClipMetadata {
    id: string;
    mediaId: string;
    mediaTitle: string;
    startSeconds: number;
    endSeconds: number;
    title?: string;
    r2Key: string;
    createdAt: number;
}

// Global in-memory store (persists across API calls in same runtime)
const globalStore = global as typeof globalThis & {
    clipsStore?: Map<string, ClipMetadata>;
};

if (!globalStore.clipsStore) {
    globalStore.clipsStore = new Map<string, ClipMetadata>();
}

export const clipsStore = globalStore.clipsStore;

// Generate a short unique ID
export function generateClipId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}
