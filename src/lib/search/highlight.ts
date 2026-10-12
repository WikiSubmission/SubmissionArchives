import { getHighlightTerms, normalizeSearchTextWithOffsets } from './queryMatch';
export function highlightSearchText(text: string, query: string) {
    if (query.startsWith('literal:')) {
        const term = query.slice(8).replace(/^"|"$/g, '');
        if (!term) return escapeHtml(text);
        return text.split(term).map(escapeHtml).join('<mark class="qs-highlight">' + escapeHtml(term) + '</mark>');
    }
    const map = normalizeSearchTextWithOffsets(text);
    const ranges: [number, number][] = [];
    for (const term of getHighlightTerms(query)) {
        let from = 0;
        while (term && from < map.normalized.length) {
            const index = map.normalized.indexOf(term, from);
            if (index < 0) break;
            ranges.push([map.offsets[index], map.ends[index + term.length - 1]]);
            from = index + term.length;
        }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const range of ranges) {
        const last = merged[merged.length - 1];
        if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
        else merged.push([...range]);
    }
    let html = '', cursor = 0;
    for (const [start, end] of merged) {
        html += escapeHtml(text.slice(cursor, start)) + '<mark class="qs-highlight">' + escapeHtml(text.slice(start, end)) + '</mark>';
        cursor = end;
    }
    return html + escapeHtml(text.slice(cursor));
}
function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
