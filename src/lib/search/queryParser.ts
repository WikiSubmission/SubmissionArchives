// Pure parser (no server-only imports) so the search route and the search UI can
// agree on what a query means without duplicating the grammar.

export type ParsedQuery = {
    // What is left after operators are stripped. Quoted phrases stay in place because
    // findQueryMatch already understands them.
    text: string;
    exclusions: string[];
    types: string[];
    before?: number;
    after?: number;
};

const YEAR_PATTERN = /^\d{4}$/;

// Natural words users are likely to type, mapped onto the catalog's own type keys.
const TYPE_ALIASES: Record<string, string> = {
    book: 'other',
    books: 'other',
    newsletter: 'perspective',
    newsletters: 'perspective',
    perspectives: 'perspective',
    appendices: 'appendix',
    videos: 'video',
    audios: 'audio',
};

export function parseAdvancedQuery(raw: string): ParsedQuery {
    const exclusions: string[] = [];
    const types: string[] = [];
    const residual: string[] = [];
    let before: number | undefined;
    let after: number | undefined;

    const tokens = raw.match(/"[^"]*"|\S+/g) ?? [];

    for (const token of tokens) {
        // Quoted phrase: hand straight through to the matcher.
        if (token.startsWith('"')) {
            residual.push(token);
            continue;
        }

        const lower = token.toLowerCase();

        if (lower.startsWith('-') && token.length > 1) {
            const term = token.slice(1).replace(/"/g, '').toLowerCase();
            if (term) {
                exclusions.push(term);
                continue;
            }
        } else if (lower.startsWith('type:')) {
            const value = lower.slice('type:'.length).replace(/"/g, '');
            if (value) {
                types.push(TYPE_ALIASES[value] ?? value);
                continue;
            }
        } else if (lower.startsWith('before:')) {
            const value = lower.slice('before:'.length);
            if (YEAR_PATTERN.test(value)) {
                before = Number(value);
                continue;
            }
        } else if (lower.startsWith('after:')) {
            const value = lower.slice('after:'.length);
            if (YEAR_PATTERN.test(value)) {
                after = Number(value);
                continue;
            }
        }

        // Unrecognised or malformed operator falls back to being plain search text,
        // so a stray colon or dash never breaks a search.
        residual.push(token);
    }

    return {
        text: residual.join(' ').trim(),
        exclusions,
        types,
        before,
        after,
    };
}

export function hasOperators(parsed: ParsedQuery): boolean {
    return parsed.exclusions.length > 0
        || parsed.types.length > 0
        || parsed.before !== undefined
        || parsed.after !== undefined;
}
