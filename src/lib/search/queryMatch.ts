const STOPWORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'from',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'was',
    'were',
    'with',
]);

export type SearchToken = {
    value: string;
    start: number;
    end: number;
};

export type SearchQueryParts = {
    phrases: string[];
    terms: string[];
    highlightTerms: string[];
    proximityWindow?: number;
};

export type QueryMatch = {
    matched: boolean;
    snippet: string;
    score: number;
    kind: 'phrase' | 'proximity' | 'all-terms' | 'single-term';
    distance?: number;
    matchedTerms: string[];
    start?: number;
    end?: number;
};

export function parseSearchQuery(query: string): SearchQueryParts {
    const nearWindow = query.match(/\bnear\/(\d{1,2})\b/i)?.[1];
    const phraseMatches = Array.from(query.matchAll(/"([^"]+)"/g), (match) => normalizeSearchText(match[1]));
    const phraseSet = new Set(phraseMatches.filter(Boolean));

    const remainder = query.replace(/"[^"]+"/g, ' ').replace(/\bnear\/\d{1,2}\b/gi, ' ');
    const terms = tokenizeSearchText(remainder)
        .map((token) => token.value)
        .filter((term) => term.length > 1 && !STOPWORDS.has(term));

    const highlightTerms = Array.from(new Set([
        ...Array.from(phraseSet),
        ...terms,
    ])).sort((a, b) => b.length - a.length);

    return {
        phrases: Array.from(phraseSet),
        terms: Array.from(new Set(terms)),
        highlightTerms,
        proximityWindow: nearWindow ? clamp(Number(nearWindow), 2, 40) : undefined,
    };
}

// `snippet: false` decides the match and its score without mapping offsets back to the
// source text, which is most of the cost on broad queries. Matched, score, kind and
// distance are the same either way; snippet, start and end are left empty.
export function findQueryMatch(
    content: string,
    query: string,
    options: { proximityWindow?: number; snippetRadius?: number; snippet?: boolean } = {},
): QueryMatch {
    const snippetRadius = options.snippetRadius ?? 80;
    const withSnippet = options.snippet !== false;
    if (query.startsWith('literal:')) {
        const literal = query.slice(8).replace(/^"|"$/g, '');
        const start = literal ? content.indexOf(literal) : -1;
        return start < 0 ? emptyMatch() : { matched: true, snippet: withSnippet ? createSnippet(content, start, start + literal.length, snippetRadius) : '', score: 120, kind: 'phrase', matchedTerms: [literal], start, end: start + literal.length };
    }
    const parsed = parseSearchQuery(query);
    const proximityWindow = parsed.proximityWindow ?? options.proximityWindow ?? 18;
    const text = content ?? '';
    const normalized = normalizeSearchText(text);
    let sourceMap: ReturnType<typeof normalizeSearchTextWithOffsets> | undefined;
    const getSourceMap = () => sourceMap ??= normalizeSearchTextWithOffsets(text);

    if (!normalized || (!parsed.phrases.length && !parsed.terms.length)) {
        return emptyMatch();
    }

    const exactPhrase = normalizeSearchText(query);
    if (exactPhrase && normalized.includes(exactPhrase)) {
        if (!withSnippet) {
            return { matched: true, snippet: '', score: 120, kind: 'phrase', distance: 0, matchedTerms: parsed.highlightTerms };
        }
        const normalizedStart = normalized.indexOf(exactPhrase);
        const start = getSourceMap().offsets[normalizedStart] ?? 0;
        const end = getSourceMap().ends[normalizedStart + exactPhrase.length - 1] ?? start;
        return {
            matched: true,
            snippet: createSnippet(text, start, end, snippetRadius),
            score: 120,
            kind: 'phrase',
            distance: 0,
            matchedTerms: parsed.highlightTerms,
            start,
            end,
        };
    }

    let bestPhrase: { start: number; end: number; phrase: string } | null = null;
    for (const phrase of parsed.phrases) {
        const phraseStart = normalized.indexOf(phrase);
        if (phraseStart === -1) {
            return emptyMatch();
        }

        if (!bestPhrase || phrase.length > bestPhrase.phrase.length) {
            const rawStart = withSnippet ? getSourceMap().offsets[phraseStart] ?? 0 : 0;
            const rawEnd = withSnippet ? getSourceMap().ends[phraseStart + phrase.length - 1] ?? rawStart : 0;
            bestPhrase = { start: rawStart, end: rawEnd, phrase };
        }
    }

    const snippetFor = (start: number, end: number) => withSnippet ? createSnippet(text, start, end, snippetRadius) : '';

    if (bestPhrase && parsed.terms.length === 0) {
        return {
            matched: true,
            snippet: snippetFor(bestPhrase.start, bestPhrase.end),
            score: 115,
            kind: 'phrase',
            distance: 0,
            matchedTerms: parsed.highlightTerms,
            start: bestPhrase.start,
            end: bestPhrase.end,
        };
    }

    // Without a snippet, token positions only need to be ordinal: proximity is measured
    // in tokens, and character offsets are only used to cut the excerpt.
    const tokens = withSnippet ? tokenizeSearchText(text) : tokenizeNormalized(normalized);
    if (parsed.terms.length === 1) {
        const single = tokens.find((token) => token.value === parsed.terms[0]);
        return single
            ? {
                  matched: true,
                  snippet: snippetFor(single.start, single.end),
                  score: bestPhrase ? 105 : 65,
                  kind: bestPhrase ? 'phrase' : 'single-term',
                  distance: 0,
                  matchedTerms: parsed.highlightTerms,
                  start: single.start,
                  end: single.end,
              }
            : emptyMatch();
    }

    const requiredTerms = new Set(parsed.terms);
    const presentTerms = new Set(tokens.filter((token) => requiredTerms.has(token.value)).map((token) => token.value));
    if (presentTerms.size !== requiredTerms.size) {
        return emptyMatch();
    }

    const windowMatch = findBestProximityWindow(tokens, parsed.terms, proximityWindow);
    if (windowMatch) {
        const tightness = Math.max(0, proximityWindow - windowMatch.distance);
        return {
            matched: true,
            snippet: snippetFor(windowMatch.start, windowMatch.end),
            score: 85 + tightness + (bestPhrase ? 25 : 0),
            kind: 'proximity',
            distance: windowMatch.distance,
            matchedTerms: parsed.highlightTerms,
            start: windowMatch.start,
            end: windowMatch.end,
        };
    }

    const fallbackWindow = findBroadWindow(tokens, parsed.terms);
    if (!fallbackWindow) return emptyMatch();

    return {
        matched: true,
        snippet: snippetFor(fallbackWindow.start, fallbackWindow.end),
        score: 45 + Math.min(20, parsed.terms.length * 4) + (bestPhrase ? 20 : 0),
        kind: bestPhrase ? 'phrase' : 'all-terms',
        distance: fallbackWindow.distance,
        matchedTerms: parsed.highlightTerms,
        start: fallbackWindow.start,
        end: fallbackWindow.end,
    };
}

// The tokens a text must contain for findQueryMatch to have any chance of matching:
// every meaningful term, plus every meaningful word of every quoted phrase. Used to
// pre-filter candidate segments against an inverted index. It lives here, beside the
// matching rules it mirrors, so the two cannot drift apart.
//
// Stopwords and single characters are omitted deliberately — they are not indexed (they
// appear nearly everywhere, so they filter almost nothing), and leaving them out keeps
// this a necessary-but-not-sufficient condition, which is exactly what a pre-filter needs.
export function getRequiredTokens(query: string): string[] {
    if (query.startsWith('literal:')) return tokenizeForIndex(query.slice(8));
    const parsed = parseSearchQuery(query);
    const tokens = new Set<string>(parsed.terms);

    for (const phrase of parsed.phrases) {
        for (const token of tokenizeSearchText(phrase)) {
            if (token.value.length > 1 && !STOPWORDS.has(token.value)) {
                tokens.add(token.value);
            }
        }
    }

    return Array.from(tokens);
}

// Same rules as getRequiredTokens applies when reading a query, so an index built with
// this will line up with what that asks for.
export function tokenizeForIndex(text: string): string[] {
    return (normalizeSearchText(text).match(/[\p{L}\p{N}]+/gu) ?? [])
        .filter(value => value.length > 1 && !STOPWORDS.has(value));
}

export function getHighlightTerms(query: string) {
    return parseSearchQuery(query).highlightTerms;
}

// Tolerant mode removes vowel/cantillation marks but preserves base-letter
// distinctions (including Arabic hamza, alef and ya forms). No orthography folding.
export function normalizeSearchText(text: string) {
    return text.toLowerCase()
        .replace(/[^\u0000-\u007f]/gu, char => /\p{Script=Latin}/u.test(char) ? char.normalize('NFD').replace(/\p{M}/gu, '') : char)
        .replace(/[\p{M}'’]/gu, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ').trim();
}

export function normalizeSearchTextWithOffsets(text: string) {
    let normalized = '';
    const offsets: number[] = [];
    const ends: number[] = [];
    let pendingSpace = -1;
    let index = 0;
    for (const original of text) {
        const end = index + original.length;
        const nonAscii = original.charCodeAt(0) > 127;
        const lower = nonAscii && /\p{Script=Latin}/u.test(original) ? original.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '') : original.toLowerCase();
        if (original === "'" || original === '\u2019' || (nonAscii && /\p{M}/u.test(original))) {
            if (ends.length) ends[ends.length - 1] = end;
        } else if (/[a-z0-9]/.test(lower) || (nonAscii && /[\p{L}\p{N}]/u.test(lower))) {
            if (pendingSpace >= 0 && normalized.length) {
                normalized += ' '; offsets.push(pendingSpace); ends.push(index);
            }
            pendingSpace = -1;
            normalized += lower;
            for (let n = 0; n < lower.length; n++) { offsets.push(index); ends.push(end); }
        } else if (pendingSpace < 0) pendingSpace = index;
        index = end;
    }
    return { normalized, offsets, ends };
}

function tokenizeSearchText(text: string): SearchToken[] {
    const map = normalizeSearchTextWithOffsets(text);
    return Array.from(map.normalized.matchAll(/[\p{L}\p{N}]+/gu), match => ({
        value: match[0], start: map.offsets[match.index!],
        end: map.ends[match.index! + match[0].length - 1],
    }));
}

function tokenizeNormalized(normalized: string): SearchToken[] {
    return Array.from(normalized.matchAll(/[\p{L}\p{N}]+/gu), match => ({
        value: match[0], start: match.index!, end: match.index! + match[0].length,
    }));
}

function findBestProximityWindow(tokens: SearchToken[], terms: string[], windowSize: number) {
    if (terms.length === 0) return null;
    const uniqueTerms = new Set(terms);
    let best: { start: number; end: number; distance: number } | null = null;

    for (let startIndex = 0; startIndex < tokens.length; startIndex++) {
        const foundTerms = new Set<string>();

        for (
            let endIndex = startIndex;
            endIndex < tokens.length && endIndex <= startIndex + windowSize;
            endIndex++
        ) {
            const token = tokens[endIndex];
            if (uniqueTerms.has(token.value)) {
                foundTerms.add(token.value);
            }

            if (foundTerms.size === uniqueTerms.size) {
                const distance = endIndex - startIndex;
                const candidate = {
                    start: tokens[startIndex].start,
                    end: tokens[endIndex].end,
                    distance,
                };
                if (!best || candidate.distance < best.distance) {
                    best = candidate;
                }
                break;
            }
        }
    }

    return best;
}

function findBroadWindow(tokens: SearchToken[], terms: string[]) {
    const positions = terms
        .map((term) => tokens.findIndex((token) => token.value === term))
        .filter((index) => index >= 0);

    if (positions.length === 0) return null;

    const startIndex = Math.min(...positions);
    const endIndex = Math.max(...positions);
    return {
        start: tokens[startIndex].start,
        end: tokens[endIndex].end,
        distance: endIndex - startIndex,
    };
}

function createSnippet(content: string, matchStart: number, matchEnd: number, radius: number) {
    const start = Math.max(0, matchStart - radius);
    const end = Math.min(content.length, matchEnd + radius);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < content.length ? '...' : '';
    return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

function emptyMatch(): QueryMatch {
    return {
        matched: false,
        snippet: '',
        score: 0,
        kind: 'all-terms',
        matchedTerms: [],
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}
