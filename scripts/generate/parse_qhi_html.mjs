// Parses the archival HTML edition of "Quran, Hadith, and Islam" (masjidtucson.org) into
// the same { metadata, sections: [{ title, content }] } shape as the existing
// quran_hadith_and_islam_complete.json, so it can be diffed against and can drop in as a
// replacement. Content is preserved verbatim — only markup is removed.
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] ?? path.join(
    'C:', 'Users', 'Jonathan', 'Downloads',
    'Quran, Hadith, and Islam by Rashad Khalifa, Ph.D.htm',
);
// Canonical filename the catalog generator reads for this book (see
// loadBookTranscriptions in generate_catalog_search_indices.mjs, driven by
// corpus_manifest.json). Writing here directly replaces it.
const OUT = path.join(process.cwd(), 'data', 'sources', 'books', 'quran_hadith_and_islam', 'quran_hadith_and_islam_complete.json');

const ENTITIES = {
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
    mdash: '—', ndash: '–', hellip: '…',
};

function decodeEntities(text) {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function stripTags(html) {
    let text = html
        // Comments removed as a whole block first: an unterminated one at a slice boundary
        // (see extractMain) would otherwise leave a bare "<!--" that <[^>]+> cannot match,
        // since that pattern requires a closing ">".
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<!--[\s\S]*$/g, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|tr|table|li|blockquote)>/gi, '\n\n')
        .replace(/<[^>]+>/g, '');
    text = decodeEntities(text);
    return text
        .split('\n')
        .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractMain(html) {
    const start = html.indexOf('InstanceBeginEditable name="editMain"');
    if (start === -1) throw new Error('editMain region not found');
    // Cut before the comment that opens "InstanceEndEditable", not the label text inside
    // it, so no unterminated "<!--" is left dangling in the slice.
    const commentOpen = html.lastIndexOf('<!--', html.indexOf('InstanceEndEditable', start + 40));
    if (commentOpen === -1) throw new Error('InstanceEndEditable region not found');
    return html.slice(start, commentOpen);
}

// Headings appear either as a bare <h1>/<h2> or as an <h2> wrapped in a colored banner
// table. Both are treated as section boundaries; everything between one and the next is
// that section's body.
function splitIntoSections(main) {
    const headingRe = /<h[123][^>]*>[\s\S]*?<\/h[123]>/gi;
    const marks = [];
    let match;
    while ((match = headingRe.exec(main))) {
        marks.push({ start: match.index, end: match.index + match[0].length, raw: match[0] });
    }

    const sections = [];
    for (let i = 0; i < marks.length; i++) {
        const title = stripTags(marks[i].raw).replace(/\s+/g, ' ').trim();
        const bodyStart = marks[i].end;
        const bodyEnd = i + 1 < marks.length ? marks[i + 1].start : main.length;
        const body = main.slice(bodyStart, bodyEnd);
        // Drop the closing banner-table markup around a table-wrapped heading, which
        // otherwise leaves stray table/tbody/tr/td noise at the top of the body text.
        const content = stripTags(body.replace(/^[\s\S]*?<\/table>/i, (m) => (m.length < 40 ? '' : m)));
        sections.push({ title, content });
    }
    return sections;
}

function main() {
    const html = fs.readFileSync(SRC, 'utf8');
    const editable = extractMain(html);
    const sections = splitIntoSections(editable);

    const out = {
        metadata: {
            title: 'Quran, Hadith, and Islam',
            source_pdf: 'quran-hadith-islam.pdf',
            source_url: 'https://www.masjidtucson.org/publications/books/qhi/qhi.html',
            // Replaces an earlier HTML-derived pass that, checked section by section against
            // this source, was missing the publisher's front-matter note on excluded Arabic
            // images and three in-text subheadings, and had spurious spaces inserted around
            // words the source wrapped in emphasis tags (e.g. " Hadith " for "Hadith"), plus
            // one letter-level corruption ("ALON E" for "ALONE"). Two hadith quotations remain
            // Arabic-image-only in the source itself, exactly as the book's own preface
            // discloses; their English translations are present in the surrounding text.
            transcription_method: 'Parsed from the archival HTML edition; markup removed, wording unchanged.',
            arabic_policy: 'Arabic text is carried through exactly as published in the HTML source.',
        },
        sections,
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');

    const chars = sections.reduce((a, s) => a + s.title.length + s.content.length, 0);
    console.log(`sections=${sections.length} chars=${chars}`);
    console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
}

main();
