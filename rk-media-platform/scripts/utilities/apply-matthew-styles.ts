
import fs from 'fs';
import path from 'path';

const WEB_NT_PATH = path.join(process.cwd(), 'public/data/web_nt.json');
const USFM_PATH = path.join(process.cwd(), '70-MATengwebu.usfm');
const USFX_PATH = path.join(process.cwd(), 'public/data/eng-web.usfx.xml');

// --- Helper Types ---

interface WebNtBook {
    abbrev: string;
    name: string;
    chapters: Verse[][];
}

interface Verse {
    num: number;
    text: string;
    footnotes: string[];
}

interface OTMap {
    [book: string]: {
        [chapter: number]: {
            [verse: number]: string;
        }
    }
}

interface ParsedVerse {
    text: string;
    footnotes: string[];
}

// --- OT Citation Definitions ---
const OT_CITATIONS: { mattRef: string, otRef: string }[] = [
    { mattRef: '1:23', otRef: 'ISA 7:14' },
    { mattRef: '2:6', otRef: 'MIC 5:2' },
    { mattRef: '2:15', otRef: 'HOS 11:1' },
    { mattRef: '2:18', otRef: 'JER 31:15' },
    { mattRef: '3:3', otRef: 'ISA 40:3' },
    { mattRef: '4:4', otRef: 'DEU 8:3' },
    { mattRef: '4:6', otRef: 'PSA 91:11-12' },
    { mattRef: '4:7', otRef: 'DEU 6:16' },
    { mattRef: '4:10', otRef: 'DEU 6:13' },
    { mattRef: '4:15-16', otRef: 'ISA 9:1-2' },
    { mattRef: '5:21', otRef: 'EXO 20:13' },
    { mattRef: '5:27', otRef: 'EXO 20:14' },
    { mattRef: '5:31', otRef: 'DEU 24:1' },
    { mattRef: '5:33', otRef: 'LEV 19:12' },
    { mattRef: '5:38', otRef: 'EXO 21:24' },
    { mattRef: '5:43', otRef: 'LEV 19:18' },
    { mattRef: '8:17', otRef: 'ISA 53:4' },
    { mattRef: '9:13', otRef: 'HOS 6:6' },
    { mattRef: '10:35-36', otRef: 'MIC 7:6' },
    { mattRef: '11:10', otRef: 'MAL 3:1' },
    { mattRef: '12:18-21', otRef: 'ISA 42:1-4' },
    { mattRef: '12:40', otRef: 'JON 1:17' },
    { mattRef: '13:14-15', otRef: 'ISA 6:9-10' },
    { mattRef: '13:35', otRef: 'PSA 78:2' },
    { mattRef: '15:4', otRef: 'EXO 20:12' },
    { mattRef: '15:8-9', otRef: 'ISA 29:13' },
    { mattRef: '19:4', otRef: 'GEN 1:27' },
    { mattRef: '19:5', otRef: 'GEN 2:24' },
    { mattRef: '21:5', otRef: 'ZEC 9:9' },
    { mattRef: '21:9', otRef: 'PSA 118:26' },
    { mattRef: '21:13', otRef: 'ISA 56:7' },
    { mattRef: '21:16', otRef: 'PSA 8:2' },
    { mattRef: '21:42', otRef: 'PSA 118:22-23' },
    { mattRef: '22:32', otRef: 'EXO 3:6' },
    { mattRef: '22:37', otRef: 'DEU 6:5' },
    { mattRef: '22:39', otRef: 'LEV 19:18' },
    { mattRef: '22:44', otRef: 'PSA 110:1' },
    { mattRef: '24:15', otRef: 'DAN 9:27' },
    { mattRef: '26:31', otRef: 'ZEC 13:7' },
    { mattRef: '27:9-10', otRef: 'ZEC 11:12-13' },
    { mattRef: '27:46', otRef: 'PSA 22:1' },
];

// --- Parsers ---

function parseUsfx(): OTMap {
    console.log('Parsing USFX for Old Testament text...');
    const xml = fs.readFileSync(USFX_PATH, 'utf-8');
    const otMap: OTMap = {};

    const books = xml.split('<book id="');
    books.shift();

    for (const bookChunk of books) {
        const bookIdMatch = bookChunk.match(/^([^"]+)"/);
        if (!bookIdMatch) continue;
        const bookId = bookIdMatch[1];

        if (bookId === 'MAT' || bookId === 'FRT') continue;

        otMap[bookId] = {};
        const chapters = bookChunk.split('<c id="');
        chapters.shift();

        for (const chapChunk of chapters) {
            const chapNumMatch = chapChunk.match(/^(\d+)"/);
            if (!chapNumMatch) continue;
            const chapNum = parseInt(chapNumMatch[1]);
            otMap[bookId][chapNum] = {};

            const verseRegex = /<v id="(\d+)"\/>([\s\S]*?)((?=<v id)|(?=<ve)|$)/g;
            let verseMatch;
            while ((verseMatch = verseRegex.exec(chapChunk)) !== null) {
                const vNum = parseInt(verseMatch[1]);
                let vText = verseMatch[2];
                vText = vText.replace(/<f[\s\S]*?<\/f>/g, '');
                vText = vText.replace(/<.*?>/g, '');
                vText = vText.replace(/\s+/g, ' ').trim();
                otMap[bookId][chapNum][vNum] = vText;
            }
        }
    }
    return otMap;
}

function processUsfmVerse(content: string): ParsedVerse {
    let text = content;
    const footnotes: string[] = [];

    // 0. Remove Cross References: \x ... \x*
    // These contain text like "+ 5:3 Isaiah..." which we don't want in the verse text.
    text = text.replace(/\\x\s+[\s\S]*?\\x\*/g, '');

    // 1. Extract Footnotes: \f + ... \f*
    const footRegex = /\\f\s+[+]\s+([\s\S]*?)\\f\*/g;
    let fIndex = 0;
    text = text.replace(footRegex, (match, noteContent) => {
        // Clean note content
        // Remove \fr, \ft tags
        let cleanNote = noteContent.replace(/\\fr\s+\d+:\d+\s*/, '');
        cleanNote = cleanNote.replace(/\\ft\s*/, '');
        cleanNote = cleanNote.replace(/\\[a-z0-9]+\s?/g, ''); // remove other internal tags
        cleanNote = cleanNote.trim();

        footnotes.push(cleanNote);
        return `__NOTE:${fIndex++}__`;
    });

    // 2. Identify Red Letter: \wj ... \wj*
    // Wrap with span.
    text = text.replace(/\\wj\s+([\s\S]*?)\\wj\*/g, (match, redText) => {
        return `<span class='text-red-800'>${redText}</span>`;
    });

    // 3. Remove Tags (\w, \+w, |strong, etc.)
    // Strongs
    text = text.replace(/\|strong="[^"]*"/g, '');
    text = text.replace(/\|[a-z]+="[^"]*"/g, '');

    // Word tags
    text = text.replace(/\\\+?[a-zA-Z0-9]+\*/g, ''); // closing
    text = text.replace(/\\\+?[a-zA-Z0-9]+\s+/g, ''); // opening

    // Other loose tags
    text = text.replace(/\\[a-z0-9]+\s?/g, ''); // All other \tags

    // 4. White space
    text = text.replace(/\s+/g, ' ').trim();

    return { text, footnotes };
}

function parseUsfmData(): Map<string, ParsedVerse> {
    console.log('Parsing USFM for Import...');
    const usfm = fs.readFileSync(USFM_PATH, 'utf-8');
    const dataMap = new Map<string, ParsedVerse>();

    const chapters = usfm.split(/\\c\s+(\d+)/);

    for (let i = 1; i < chapters.length; i += 2) {
        const chapNum = parseInt(chapters[i]);
        const content = chapters[i + 1];

        // Split verses
        const verses = content.split(/\\v\s+(\d+)/);

        for (let j = 1; j < verses.length; j += 2) {
            const vNum = parseInt(verses[j]);
            const vContent = verses[j + 1];

            const parsed = processUsfmVerse(vContent);
            dataMap.set(`${chapNum}:${vNum}`, parsed);
        }
    }
    return dataMap;
}

function getOtText(otMap: OTMap, ref: string): string {
    const [book, cv] = ref.split(' ');
    const [chapStr, vStr] = cv.split(':');
    const chap = parseInt(chapStr);

    if (vStr.includes('-')) {
        const [start, end] = vStr.split('-').map(n => parseInt(n));
        let text = '';
        for (let v = start; v <= end; v++) {
            if (otMap[book]?.[chap]?.[v]) {
                text += otMap[book][chap][v] + ' ';
            }
        }
        return text.trim();
    } else {
        const v = parseInt(vStr);
        return otMap[book]?.[chap]?.[v] || 'Text not found';
    }
}

// --- Main Logic ---

function applyStyles() {
    const otMap = parseUsfx();
    const usfmData = parseUsfmData();

    const webNt = JSON.parse(fs.readFileSync(WEB_NT_PATH, 'utf-8'));
    const matthew = webNt[0] as WebNtBook;

    if (matthew.name !== 'Matthew') {
        throw new Error('First book is not Matthew!');
    }

    let updateCount = 0;
    let citationCount = 0;

    matthew.chapters.forEach((chapterVerses) => {
        const actualChapNum = matthew.chapters.indexOf(chapterVerses) + 1;

        chapterVerses.forEach((verse) => {
            // 1. Overwrite with Verified USFM Data (Fixes Truncation & Applies Red Letter)
            const usfmVerse = usfmData.get(`${actualChapNum}:${verse.num}`);

            if (usfmVerse) {
                verse.text = usfmVerse.text;
                verse.footnotes = usfmVerse.footnotes;
                updateCount++;
            } else {
                console.warn(`Missing USFM data for Matt ${actualChapNum}:${verse.num}`);
            }

            // 2. Apply OT Citations (Blue Overlay)
            const citation = OT_CITATIONS.find(c => {
                if (c.mattRef.includes('-')) {
                    const [cVal, vRange] = c.mattRef.split(':');
                    if (parseInt(cVal) !== actualChapNum) return false;
                    const [start, end] = vRange.split('-').map(Number);
                    return verse.num >= start && verse.num <= end;
                }
                return c.mattRef === `${actualChapNum}:${verse.num}`;
            });

            if (citation) {
                const otText = getOtText(otMap, citation.otRef);

                const bgClass = "bg-blue-50/50 hover:bg-blue-100 border-b border-blue-200 cursor-help relative group text-blue-900 rounded-sm px-0.5";
                const tooltipClass = "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-96 px-4 py-3 bg-gray-900 text-white text-xs rounded shadow-lg z-50 font-sans normal-case tracking-normal opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal text-left leading-relaxed";

                const tooltipHtml = `<span class='${tooltipClass}'><strong class='block text-amber-400 mb-1'>${citation.otRef}</strong> ${otText}</span>`;

                let vText = verse.text;

                // Match quotes
                const quoteRegex = /([“"‘].*?[”"’])/;

                // Note: text might now have <span red>...</span>
                // Quote regex might fail if quote is split by span?
                // Actually, spans are inside the text.
                // If " <span red>Quote</span> " -> regex matches " ... ".
                // But if quote wraps span: " <span red>Quote</span> "
                // My quote regex `[“"‘].*?[”"’]` will match `"<span ...>..."`.
                // This is fine. The blue span will wrap the Red span.

                if (quoteRegex.test(vText)) {
                    vText = vText.replace(quoteRegex, (match) => {
                        return `<span class='${bgClass}'>${match}${tooltipHtml}</span>`;
                    });
                    verse.text = vText;
                    citationCount++;
                } else {
                    // Fallback
                    verse.text = `<span class='${bgClass}'>${verse.text}${tooltipHtml}</span>`;
                    citationCount++;
                }
            }
        });
    });

    console.log(`Updated ${updateCount} verses from USFM.`);
    console.log(`Applied OT Citations to ${citationCount} verses.`);

    fs.writeFileSync(WEB_NT_PATH, JSON.stringify(webNt, null, 2));
    console.log('Done!');
}

applyStyles();
