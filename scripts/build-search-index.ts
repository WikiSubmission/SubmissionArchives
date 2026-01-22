
import fs from 'fs';
import path from 'path';

interface Newsletter {
    id: string;
    title: string;
    content: string;
    displayDate: string;
    filename: string;
}

interface OptimizedIndex {
    documents: Array<{
        id: string;
        title: string;
        titleLower: string;
        date: string;
        filename: string;
    }>;
    invertedIndex: Record<string, string[]>; // word -> [docIds]
    ngrams: Record<string, string[]>; // trigram -> [words]
    metadata: {
        totalDocuments: number;
        totalWords: number;
        buildDate: string;
    };
}

// Separate file for content (loaded on-demand)
interface ContentStore {
    [docId: string]: string;
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // Filter out short words
}


function getPhoneticCode(word: string): string {
    let code = word.toUpperCase();
    code = code.replace(/[^A-Z]/g, '');
    if (code.length === 0) return '';
    if (code.startsWith('KN') || code.startsWith('GN') || code.startsWith('PN') || code.startsWith('AE') || code.startsWith('WR')) {
        code = code.substring(1);
    }
    let ph = '';
    const len = code.length;
    for (let i = 0; i < len; i++) {
        const c = code[i];
        const next = code[i + 1] || '';
        const prev = code[i - 1] || '';
        if (c === prev && c !== 'C') continue;
        switch (c) {
            case 'A': case 'E': case 'I': case 'O': case 'U':
                if (i === 0) ph += c;
                break;
            case 'B':
                if (prev === 'M' && i === len - 1) break;
                ph += 'B';
                break;
            case 'C':
                if (next === 'H') { ph += 'X'; i++; }
                else if (next === 'I' || next === 'E' || next === 'Y') { ph += 'S'; }
                else { ph += 'K'; }
                break;
            case 'D':
                if (next === 'G' && (code[i + 2] === 'E' || code[i + 2] === 'I' || code[i + 2] === 'Y')) { ph += 'J'; i += 2; }
                else { ph += 'T'; }
                break;
            case 'F': ph += 'F'; break;
            case 'G':
                if (next === 'H') {
                    if (i > 0 && !'AEIOU'.includes(code[i - 2])) ph += 'F';
                    i++;
                } else if (next === 'N') { ph += 'N'; }
                else if (next === 'I' || next === 'E' || next === 'Y') { ph += 'J'; }
                else { ph += 'K'; }
                break;
            case 'H':
                if (i === 0 || 'AEIOU'.includes(prev)) ph += 'H';
                break;
            case 'J': ph += 'J'; break;
            case 'K': if (prev !== 'C') ph += 'K'; break;
            case 'L': ph += 'L'; break;
            case 'M': ph += 'M'; break;
            case 'N': ph += 'N'; break;
            case 'P': if (next === 'H') { ph += 'F'; i++; } else { ph += 'P'; } break;
            case 'Q': ph += 'K'; break;
            case 'R': ph += 'R'; break;
            case 'S': if (next === 'H') { ph += 'X'; i++; } else { ph += 'S'; } break;
            case 'T':
                if (next === 'H') { ph += '0'; i++; }
                else if (next === 'I' && (code[i + 2] === 'O' || code[i + 2] === 'A')) { ph += 'X'; }
                else { ph += 'T'; }
                break;
            case 'V': ph += 'F'; break;
            case 'W': case 'Y': if (i === 0) ph += c; break;
            case 'X': ph += 'KS'; break;
            case 'Z': ph += 'S'; break;
        }
    }
    return ph;
}

function buildSearchIndex() {
    console.log('[Build] Starting search index generation...');

    const sourcePath = 'src/data/newsletters/search_index.json';

    if (!fs.existsSync(sourcePath)) {
        console.error(`[Build] Source file not found: ${sourcePath}`);
        process.exit(1);
    }

    const sourceData = JSON.parse(
        fs.readFileSync(sourcePath, 'utf-8')
    ) as Newsletter[];

    console.log(`[Build] Loaded ${sourceData.length} newsletters`);

    // UPDATED INTERFACE to use phonetic instead of ngrams
    const index: any = {
        documents: [],
        invertedIndex: {},
        phonetic: {}, // CHANGED
        metadata: {
            totalDocuments: sourceData.length,
            totalWords: 0,
            buildDate: new Date().toISOString()
        }
    };

    const contentStore: ContentStore = {};
    const vocabularySet = new Set<string>();

    sourceData.forEach((newsletter, idx) => {
        if (idx % 50 === 0) {
            console.log(`[Build] Processing ${idx}/${sourceData.length}...`);
        }

        index.documents.push({
            id: newsletter.id,
            title: newsletter.title,
            titleLower: newsletter.title.toLowerCase(),
            date: newsletter.displayDate,
            filename: newsletter.filename
        });

        contentStore[newsletter.id] = newsletter.content;

        const titleWords = tokenize(newsletter.title);
        const contentWords = tokenize(newsletter.content);
        const allWords = [...new Set([...titleWords, ...contentWords])];

        allWords.forEach(word => {
            vocabularySet.add(word);

            if (!index.invertedIndex[word]) {
                index.invertedIndex[word] = [];
            }

            if (!index.invertedIndex[word].includes(newsletter.id)) {
                index.invertedIndex[word].push(newsletter.id);
            }
        });
    });

    console.log(`[Build] Vocabulary size: ${vocabularySet.size} unique words`);
    index.metadata.totalWords = vocabularySet.size;

    // Build Phonetic Index
    console.log('[Build] Building phonetic index for fuzzy matching...');
    let phoneticCount = 0;

    vocabularySet.forEach(word => {
        const code = getPhoneticCode(word);
        if (!code) return;

        if (!index.phonetic[code]) {
            index.phonetic[code] = [];
            phoneticCount++;
        }
        if (!index.phonetic[code].includes(word)) {
            index.phonetic[code].push(word);
        }
    });

    console.log(`[Build] Generated ${phoneticCount} phonetic codes from ${vocabularySet.size} words`);

    // Write optimized index
    const indexPath = 'src/data/newsletters/search-index-optimized.json';
    fs.writeFileSync(indexPath, JSON.stringify(index));

    // Write content store
    const contentPath = 'src/data/newsletters/search-content.json';
    fs.writeFileSync(contentPath, JSON.stringify(contentStore));

    // Calculate sizes
    const indexSize = (fs.statSync(indexPath).size / 1024 / 1024).toFixed(2);
    const contentSize = (fs.statSync(contentPath).size / 1024 / 1024).toFixed(2);

    console.log(`[Build] ✓ Index generated: ${indexSize}MB`);
    console.log(`[Build] ✓ Content store: ${contentSize}MB`);
    console.log(`[Build] ✓ Total: ${(parseFloat(indexSize) + parseFloat(contentSize)).toFixed(2)}MB`);

    // Generate statistics file
    const stats = {
        totalDocuments: index.metadata.totalDocuments,
        totalWords: index.metadata.totalWords,
        totalPhoneticCodes: phoneticCount,
        indexSize: `${indexSize}MB`,
        contentSize: `${contentSize}MB`,
        buildDate: index.metadata.buildDate,
        averageWordsPerDocument: Math.round(index.metadata.totalWords / index.metadata.totalDocuments),
        compressionRatio: `${((parseFloat(indexSize) + parseFloat(contentSize)) / 10 * 100).toFixed(1)}%`
    };

    fs.writeFileSync(
        'src/data/newsletters/search-stats.json',
        JSON.stringify(stats, null, 2)
    );

    console.log('[Build] ✓ Search index build complete!');
    console.log(JSON.stringify(stats, null, 2));
}


// Run directly
buildSearchIndex();


export { buildSearchIndex };
