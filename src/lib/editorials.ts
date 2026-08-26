import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';
import { z } from 'zod';

export const EDITORIALS_CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'editorials');

/**
 * YAML parses an unquoted `2026-08-25` into a Date, so dates are normalised back
 * to a calendar string before the format is checked.
 */
const isoDateSchema = z.preprocess(
    (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a YYYY-MM-DD date'),
);

/**
 * Frontmatter is author-written, so it is validated at the boundary rather than
 * trusted. A malformed editorial fails the build with the offending file named.
 */
const editorialFrontmatterSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    author: z.string().min(1),
    publishedAt: isoDateSchema,
    updatedAt: isoDateSchema.optional(),
    summary: z.string().min(1),
    topics: z.array(z.string().min(1)).default([]),
    hero: z
        .object({
            src: z.string().min(1),
            alt: z.string().min(1),
            width: z.number().int().positive(),
            height: z.number().int().positive(),
            caption: z.string().optional(),
        })
        .optional(),
    thumbnail: z
        .object({
            src: z.string().min(1),
            alt: z.string().min(1),
            width: z.number().int().positive().default(800),
            height: z.number().int().positive().default(600),
        })
        .optional(),
    draft: z.boolean().default(false),
});

export * from './editorialTypes';
import { formatEditorialDate, type Editorial, type EditorialHeading, type EditorialSummary, type EditorialFrontmatter } from './editorialTypes';

const WORDS_PER_MINUTE = 220;

/** Slug segments come from the filesystem, but the route param does not. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function editorialFilePath(slug: string): string {
    return path.join(EDITORIALS_CONTENT_DIR, slug, 'index.mdx');
}

function readEditorialSource(slug: string): string {
    if (!SLUG_PATTERN.test(slug)) {
        throw new Error(`Invalid editorial slug: ${slug}`);
    }

    const filePath = editorialFilePath(slug);
    // Defence in depth: the slug pattern already forbids separators, but the
    // resolved path is re-checked so no route param can escape the content dir.
    if (!path.resolve(filePath).startsWith(path.resolve(EDITORIALS_CONTENT_DIR) + path.sep)) {
        throw new Error(`Editorial slug resolves outside the content directory: ${slug}`);
    }

    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Fenced code and inline JSX are removed before headings or words are counted,
 * so a `#` inside a code sample never becomes a sidebar entry.
 */
function stripNonProse(body: string): string {
    return body
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^import\s.+$/gm, '')
        .replace(/^export\s.+$/gm, '');
}

export function extractHeadings(body: string): EditorialHeading[] {
    // A fresh slugger per document mirrors rehype-slug, including its
    // `-1`, `-2` suffixes for repeated headings.
    const slugger = new GithubSlugger();
    const headings: EditorialHeading[] = [];

    for (const line of stripNonProse(body).split('\n')) {
        const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
        if (!match) continue;

        const text = match[2].replace(/[*_`]/g, '').trim();
        if (!text) continue;

        headings.push({
            id: slugger.slug(text),
            text,
            level: match[1].length === 2 ? 2 : 3,
        });
    }

    return headings;
}

export function countWords(body: string): number {
    const prose = stripNonProse(body)
        // Drop JSX tags but keep the prose they wrap.
        .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
        .replace(/[#>*_`|[\]()-]/g, ' ');

    const words = prose.split(/\s+/).filter(Boolean);
    return words.length;
}

function parseEditorial(slug: string): Editorial {
    const source = readEditorialSource(slug);

    let data: Record<string, unknown>;
    let content: string;
    try {
        const parsedFile = matter(source);
        data = parsedFile.data;
        content = parsedFile.content;
    } catch (error: unknown) {
        // A YAML error otherwise surfaces with no indication of which editorial
        // produced it. An unquoted colon in a value is the usual cause.
        const reason = error instanceof Error ? error.message : 'unknown error';
        throw new Error(
            `Could not parse frontmatter in src/content/editorials/${slug}/index.mdx — ${reason}. ` +
                'Values containing a colon must be quoted.',
        );
    }

    const parsed = editorialFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`);
        throw new Error(`Invalid frontmatter in src/content/editorials/${slug}/index.mdx — ${issues.join('; ')}`);
    }

    const wordCount = countWords(content);

    return {
        ...parsed.data,
        slug,
        wordCount,
        readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
        headings: extractHeadings(content),
    };
}

function listSlugsOnDisk(): string[] {
    if (!fs.existsSync(EDITORIALS_CONTENT_DIR)) {
        return [];
    }

    return fs
        .readdirSync(EDITORIALS_CONTENT_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && SLUG_PATTERN.test(entry.name))
        .filter((entry) => fs.existsSync(editorialFilePath(entry.name)))
        .map((entry) => entry.name);
}

/** Newest first. Drafts are excluded outside development. */
export function getEditorials(): Editorial[] {
    const includeDrafts = process.env.NODE_ENV === 'development';

    return listSlugsOnDisk()
        .map(parseEditorial)
        .filter((editorial) => includeDrafts || !editorial.draft)
        .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title));
}

export function getEditorialSlugs(): string[] {
    return getEditorials().map((editorial) => editorial.slug);
}

export function getEditorial(slug: string): Editorial | null {
    if (!getEditorialSlugs().includes(slug)) {
        return null;
    }

    return parseEditorial(slug);
}

export type EditorialNeighbours = {
    previous: EditorialSummary | null;
    next: EditorialSummary | null;
};

/**
 * "Previous" is the older editorial and "next" the newer one, matching the
 * reading order a visitor works through the archive in.
 */
export function getEditorialNeighbours(slug: string): EditorialNeighbours {
    const editorials = getEditorials();
    const index = editorials.findIndex((editorial) => editorial.slug === slug);

    if (index === -1) {
        return { previous: null, next: null };
    }

    return {
        next: editorials[index - 1] ?? null,
        previous: editorials[index + 1] ?? null,
    };
}
