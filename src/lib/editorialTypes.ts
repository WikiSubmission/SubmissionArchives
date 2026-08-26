export type EditorialFrontmatter = {
    title: string;
    subtitle?: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    summary: string;
    topics: string[];
    hero?: {
        src: string;
        alt: string;
        width: number;
        height: number;
        caption?: string;
    };
    thumbnail?: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    draft?: boolean;
};

export type EditorialHeading = {
    id: string;
    text: string;
    /** 2 for a top-level section, 3 for a subsection. */
    level: 2 | 3;
};

export type EditorialSummary = EditorialFrontmatter & {
    slug: string;
    wordCount: number;
    readingMinutes: number;
};

export type Editorial = EditorialSummary & {
    headings: EditorialHeading[];
};

export type EditorialNeighbours = {
    previous: EditorialSummary | null;
    next: EditorialSummary | null;
};

export function formatEditorialDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
