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

export function findQueryMatch(
    content: string,
    query: string,
    options: { proximityWindow?: number; snippetRadius?: number } = {},
): QueryMatch {
    const snippetRadius = options.snippetRadius ?? 80;
    const parsed = parseSearchQuery(query);
    const proximityWindow = parsed.proximityWindow ?? options.proximityWindow ?? 18;
    const text = content ?? '';
    const normalized = normalizeSearchText(text);

    if (!normalized || (!parsed.phrases.length && !parsed.terms.length)) {
        return emptyMatch();
    }

    const exactPhrase = normalizeSearchText(query);
    if (exactPhrase && normalized.includes(exactPhrase)) {
        const start = normalized.indexOf(exactPhrase);
        return {
            matched: true,
            snippet: createSnippet(text, start, start + exactPhrase.length, snippetRadius),
            score: 120,
            kind: 'phrase',
            distance: 0,
            matchedTerms: parsed.highlightTerms,
        };
    }

    let bestPhrase: { start: number; end: number; phrase: string } | null = null;
    for (const phrase of parsed.phrases) {
        const phraseStart = normalized.indexOf(phrase);
        if (phraseStart === -1) {
            return emptyMatch();
        }

        if (!bestPhrase || phrase.length > bestPhrase.phrase.length) {
            bestPhrase = { start: phraseStart, end: phraseStart + phrase.length, phrase };
        }
    }

    if (bestPhrase && parsed.terms.length === 0) {
        return {
            matched: true,
            snippet: createSnippet(text, bestPhrase.start, bestPhrase.end, snippetRadius),
            score: 115,
            kind: 'phrase',
            distance: 0,
            matchedTerms: parsed.highlightTerms,
        };
    }

    const tokens = tokenizeSearchText(text);
    if (parsed.terms.length === 1) {
        const single = tokens.find((token) => token.value === parsed.terms[0]);
        return single
            ? {
                  matched: true,
                  snippet: createSnippet(text, single.start, single.end, snippetRadius),
                  score: bestPhrase ? 105 : 65,
                  kind: bestPhrase ? 'phrase' : 'single-term',
                  distance: 0,
                  matchedTerms: parsed.highlightTerms,
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
            snippet: createSnippet(text, windowMatch.start, windowMatch.end, snippetRadius),
            score: 85 + tightness + (bestPhrase ? 25 : 0),
            kind: 'proximity',
            distance: windowMatch.distance,
            matchedTerms: parsed.highlightTerms,
        };
    }

    const fallbackWindow = findBroadWindow(tokens, parsed.terms);
    if (!fallbackWindow) return emptyMatch();

    return {
        matched: true,
        snippet: createSnippet(text, fallbackWindow.start, fallbackWindow.end, snippetRadius),
        score: 45 + Math.min(20, parsed.terms.length * 4) + (bestPhrase ? 20 : 0),
        kind: bestPhrase ? 'phrase' : 'all-terms',
        distance: fallbackWindow.distance,
        matchedTerms: parsed.highlightTerms,
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
    const normalized = text.toLowerCase().replace(/['’]/g, '');
    const tokens: string[] = [];
    const regex = /[a-z0-9]+/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
        if (match[0].length > 1 && !STOPWORDS.has(match[0])) {
            tokens.push(match[0]);
        }
    }

    return tokens;
}

export function getHighlightTerms(query: string) {
    return parseSearchQuery(query).highlightTerms;
}

export function normalizeSearchText(text: string) {
    return text
        .toLowerCase()
        .replace(/['\u2019]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeSearchText(text: string): SearchToken[] {
    const normalizedText = text
        .toLowerCase()
        .replace(/['\u2019]/g, '');
    const tokens: SearchToken[] = [];
    const regex = /[a-z0-9]+/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalizedText)) !== null) {
        tokens.push({
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return tokens;
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
