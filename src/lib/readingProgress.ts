// Per-document reading position, keyed by document id rather than URL so a moved or
// redirected route does not orphan someone's place.

const STORAGE_PREFIX = 'sa-reading-progress:';

export type ReadingProgress = {
    page: number;
    totalPages: number;
};

export function saveProgress(documentId: string, progress: ReadingProgress): void {
    if (typeof window === 'undefined' || !documentId) return;
    if (!Number.isFinite(progress.page) || progress.page < 1) return;

    try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${documentId}`, JSON.stringify(progress));
    } catch {
        // Private mode or quota — losing a bookmark is preferable to breaking the reader.
    }
}

export function getProgress(documentId: string): ReadingProgress | null {
    if (typeof window === 'undefined' || !documentId) return null;

    try {
        const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${documentId}`);
        if (!raw) return null;

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;

        const { page, totalPages } = parsed as Record<string, unknown>;
        if (typeof page !== 'number' || !Number.isFinite(page) || page < 1) return null;
        if (typeof totalPages !== 'number' || !Number.isFinite(totalPages) || totalPages < 1) return null;

        return { page, totalPages };
    } catch {
        return null;
    }
}

// Only worth offering a resume when the reader is meaningfully into the document and
// has not effectively finished it.
export function shouldOfferResume(progress: ReadingProgress | null): boolean {
    if (!progress) return false;
    const fraction = progress.page / progress.totalPages;
    return fraction > 0.05 && fraction < 0.95;
}
