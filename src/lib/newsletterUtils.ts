
import { Newsletter } from '@/types/media';
import metadata from '../../public/data/newsletters/metadata.json';

// Type assertion since we're importing JSON directly
const newsletters = metadata as unknown as Newsletter[];

export function getAdjacentNewsletters(currentId: string) {
    // Sort by fullDate descending (newest first) or ascending?
    // Usually "Previous" means older (left) and "Next" means newer (right)? 
    // Or "Previous" in a list means the one before it?
    // Let's stick to Chronological Order:
    // Previous <--- [Current] ---> Next
    // Previous = Older, Next = Newer

    // Sort ascending by date
    const sorted = [...newsletters].sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    const index = sorted.findIndex(n => n.id === currentId);

    if (index === -1) return { prevId: null, nextId: null };

    const prev = index > 0 ? sorted[index - 1] : null;
    const next = index < sorted.length - 1 ? sorted[index + 1] : null;

    return {
        prevId: prev ? prev.id : null,
        nextId: next ? next.id : null,
        prevTitle: prev ? prev.title : null,
        nextTitle: next ? next.title : null // Optional: might use title later
    };
}
