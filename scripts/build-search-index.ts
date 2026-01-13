
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

function generateTrigrams(word: string): string[] {
    if (word.length < 3) return [];
    const trigrams: string[] = [];
    for (let i = 0; i <= word.length - 3; i++) {
        trigrams.push(word.substring(i, i + 3));
    }
    return trigrams;
}

function buildSearchIndex() {
    console.log('[Build] Starting search index generation...');

    const sourcePath = 'src/data/newsletters/search_index.json'; // Changed from public to src/data where we moved it

    if (!fs.existsSync(sourcePath)) {
        console.error(`[Build] Source file not found: ${sourcePath}`);
        process.exit(1);
    }

    // Load source data
    const sourceData = JSON.parse(
        fs.readFileSync(sourcePath, 'utf-8')
    ) as Newsletter[];

    console.log(`[Build] Loaded ${sourceData.length} newsletters`);

    const index: OptimizedIndex = {
        documents: [],
        invertedIndex: {},
        ngrams: {},
        metadata: {
            totalDocuments: sourceData.length,
            totalWords: 0,
            buildDate: new Date().toISOString()
        }
    };

    const contentStore: ContentStore = {};
    const vocabularySet = new Set<string>();

    // Process each document
    sourceData.forEach((newsletter, idx) => {
        if (idx % 50 === 0) {
            console.log(`[Build] Processing ${idx}/${sourceData.length}...`);
        }

        // Store document metadata
        index.documents.push({
            id: newsletter.id,
            title: newsletter.title,
            titleLower: newsletter.title.toLowerCase(),
            date: newsletter.displayDate,
            filename: newsletter.filename
        });

        // Store content separately
        contentStore[newsletter.id] = newsletter.content;

        // Tokenize title and content
        const titleWords = tokenize(newsletter.title);
        const contentWords = tokenize(newsletter.content);
        const allWords = [...new Set([...titleWords, ...contentWords])];

        // Build inverted index
        allWords.forEach(word => {
            vocabularySet.add(word);

            if (!index.invertedIndex[word]) {
                index.invertedIndex[word] = [];
            }

            // Store document ID if not already present
            if (!index.invertedIndex[word].includes(newsletter.id)) {
                index.invertedIndex[word].push(newsletter.id);
            }
        });
    });

    console.log(`[Build] Vocabulary size: ${vocabularySet.size} unique words`);
    index.metadata.totalWords = vocabularySet.size;

    // Build n-gram index for fuzzy matching
    console.log('[Build] Building n-gram index for fuzzy matching...');
    let ngramCount = 0;

    vocabularySet.forEach(word => {
        const trigrams = generateTrigrams(word);
        trigrams.forEach(trigram => {
            if (!index.ngrams[trigram]) {
                index.ngrams[trigram] = [];
                ngramCount++;
            }
            if (!index.ngrams[trigram].includes(word)) {
                index.ngrams[trigram].push(word);
            }
        });
    });

    console.log(`[Build] Generated ${ngramCount} unique trigrams`);

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
        totalTrigrams: ngramCount,
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

// Run if called directly
if (require.main === module) {
    try {
        buildSearchIndex();
    } catch (error) {
        console.error('[Build] Error:', error);
        process.exit(1);
    }
}

export { buildSearchIndex };
