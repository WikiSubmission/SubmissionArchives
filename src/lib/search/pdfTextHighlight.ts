// Shared between PDFReaderClient (flat 2D reader) and BookReaderClient's
// hidden accessibility text layer (3D reader), so a search match highlights
// identically in both instead of two implementations quietly diverging.

export interface HighlightTextItem {
    str: string;
    itemIndex: number;
}

// Scanned/OCR'd PDFs often lay out text one glyph (or a few) per text item, so a
// search term almost never appears inside a single item's own string. Instead we
// concatenate every item's text on the page (ignoring whitespace and punctuation,
// since OCR spacing/apostrophes are unreliable), find each individual search term
// in that combined stream, and map matches back to which items they span so each
// one can be highlighted individually. Terms are matched independently (not as one
// literal phrase) to mirror how the search results page highlights matches — a
// multi-word query like "quran mathematical miracle" should highlight each word
// wherever it appears, not only if that exact phrase occurs in that exact order.
export function computeHighlightRanges(
    items: HighlightTextItem[],
    terms: string[],
): Map<number, Array<[number, number]>> {
    const ranges = new Map<number, Array<[number, number]>>();
    if (terms.length === 0) return ranges;

    const charMap: Array<{ itemIndex: number; localIndex: number }> = [];
    let combined = '';
    items.forEach((item) => {
        for (let i = 0; i < item.str.length; i++) {
            const char = item.str[i];
            if (/[\s'’]/.test(char)) continue;
            if (!/[a-z0-9]/i.test(char)) continue;
            combined += char.toLowerCase();
            charMap.push({ itemIndex: item.itemIndex, localIndex: i });
        }
    });

    const addRange = (matchStart: number, matchEnd: number) => {
        for (let i = matchStart; i <= matchEnd; i++) {
            const { itemIndex, localIndex } = charMap[i];
            const existing = ranges.get(itemIndex) ?? [];
            const last = existing[existing.length - 1];
            if (last && last[1] === localIndex - 1) {
                last[1] = localIndex;
            } else {
                existing.push([localIndex, localIndex]);
            }
            ranges.set(itemIndex, existing);
        }
    };

    for (const term of terms) {
        const needle = term.replace(/[\s'’]/g, '').toLowerCase();
        if (!needle) continue;

        let searchFrom = 0;
        while (searchFrom <= combined.length) {
            const matchStart = combined.indexOf(needle, searchFrom);
            if (matchStart === -1) break;
            const matchEnd = matchStart + needle.length - 1;
            addRange(matchStart, matchEnd);
            searchFrom = matchEnd + 1;
        }
    }

    // Ranges were appended term-by-term, not in left-to-right document order, but
    // callers walk each item's ranges assuming ascending, non-overlapping order.
    for (const [itemIndex, itemRanges] of ranges) {
        itemRanges.sort((a, b) => a[0] - b[0]);
        const merged: Array<[number, number]> = [];
        for (const [start, end] of itemRanges) {
            const last = merged[merged.length - 1];
            if (last && start <= last[1] + 1) {
                last[1] = Math.max(last[1], end);
            } else {
                merged.push([start, end]);
            }
        }
        ranges.set(itemIndex, merged);
    }

    return ranges;
}

/** Split one item's string into plain/highlighted segments per its ranges. */
export function splitByRanges(str: string, ranges: Array<[number, number]> | undefined): Array<{ text: string; highlighted: boolean }> {
    if (!ranges || ranges.length === 0) return [{ text: str, highlighted: false }];
    const segments: Array<{ text: string; highlighted: boolean }> = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
        if (start > cursor) segments.push({ text: str.slice(cursor, start), highlighted: false });
        segments.push({ text: str.slice(start, end + 1), highlighted: true });
        cursor = end + 1;
    }
    if (cursor < str.length) segments.push({ text: str.slice(cursor), highlighted: false });
    return segments;
}
