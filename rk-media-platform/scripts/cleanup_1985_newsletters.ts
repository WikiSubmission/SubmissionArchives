import fs from 'fs';
import path from 'path';

const JSON_DIR = path.join(process.cwd(), 'public/data/newsletters/html');

// Patterns for Quran verse references
const VERSE_PATTERNS = [
    /\(Qur'?an?\s+\d+:\d+(-\d+)?\)/gi,
    /\(Sura\s+\d+:\d+(-\d+)?\)/gi,
    /\(\d+:\d+(-\d+)?\)/g,
    /\[\d+:\d+(-\d+)?\]/g
];

// Check if text contains a verse reference
function hasVerseReference(text: string): boolean {
    return VERSE_PATTERNS.some(pattern => pattern.test(text));
}

// Extract verse reference from text
function extractVerseReference(text: string): string | null {
    for (const pattern of VERSE_PATTERNS) {
        const match = text.match(pattern);
        if (match) return match[0];
    }
    return null;
}

// Check if text is likely a Quran verse (has reference and is substantial)
function isLikelyVerse(text: string): boolean {
    return hasVerseReference(text) && text.length > 80 && !text.includes('states:');
}

// Process a single newsletter
function processNewsletter(filename: string) {
    const filePath = path.join(JSON_DIR, filename);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    let modified = false;
    const newSections: any[] = [];

    for (const section of content.document.sections) {
        // Skip sections that are already properly formatted
        if (section.quote_block || section.quotes || section.section_divider || section.image) {
            newSections.push(section);
            continue;
        }

        // Process content arrays
        if (section.content && Array.isArray(section.content)) {
            const newContent: string[] = [];

            for (const text of section.content) {
                // Check if this looks like a verse that should be extracted
                if (isLikelyVerse(text)) {
                    // Flush current content
                    if (newContent.length > 0) {
                        newSections.push({
                            title: section.title,
                            content: newContent.slice()
                        });
                        newContent.length = 0;
                    }

                    // Extract the verse
                    const reference = extractVerseReference(text);
                    const verseText = text.replace(/\(Qur'?an?\s+\d+:\d+(-\d+)?\)/gi, '')
                        .replace(/\(Sura\s+\d+:\d+(-\d+)?\)/gi, '')
                        .replace(/\(\d+:\d+(-\d+)?\)/g, '')
                        .replace(/\[\d+:\d+(-\d+)?\]/g, '')
                        .trim();

                    newSections.push({
                        quote_block: {
                            text: verseText,
                            reference: reference || ''
                        }
                    });
                    modified = true;
                } else {
                    newContent.push(text);
                }
            }

            // Add remaining content
            if (newContent.length > 0 || section.title) {
                newSections.push({
                    ...(section.title && { title: section.title }),
                    content: newContent
                });
            }
        } else {
            newSections.push(section);
        }
    }

    if (modified) {
        content.document.sections = newSections;
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log(`✓ Processed ${filename}`);
    } else {
        console.log(`- Skipped ${filename} (no changes needed)`);
    }
}

// Process all 1985 newsletters
const files = fs.readdirSync(JSON_DIR)
    .filter(f => f.startsWith('1985_') && f.endsWith('.json'))
    .sort();

console.log(`Processing ${files.length} newsletters from 1985...\n`);

for (const file of files) {
    try {
        processNewsletter(file);
    } catch (error) {
        console.error(`✗ Error processing ${file}:`, error);
    }
}

console.log('\nDone!');
