import { ScriptureVerse } from "@/app/scripture/actions";

// --- Types ---
export type BlockType = 'heading' | 'verse' | 'genealogy' | 'intro';

export interface TextBlock {
    type: BlockType;
    subtype?: 'book' | 'chapter'; // for 'intro'
    content: ScriptureVerse[] | string; // verses for 'verse'/'genealogy', string for 'heading'/'intro'
}

// --- Prologue / Intro Data ---
const INTRO_CONTENT: Record<string, string[]> = {
    "Matthew 1": [
        "__BOOK_INTRO__",
        "According to academic biblical scholars, the Gospel of Matthew is an anonymous Greek composition written by an educated Jewish Christian who was not an eyewitness to Jesus’ life. They argue that the work was likely composed around 80–90 CE, after the destruction of the Jerusalem Temple, and is literarily dependent on the Gospel of Mark as well as a sayings source (often called Q), demonstrating that its author was not the apostle Matthew, a Palestinian Aramaic-speaking tax collector. The traditional attribution to Matthew, Dr. Ehrman and other scholars maintain, arose later in the second century as part of the church’s effort to connect anonymous writings to apostolic authority. Matthew was written for a Jewish-Christian community engaged in conflict with other Jewish groups, which explains its strong emphasis on Jesus as the fulfillment of Scripture, its use of proof-texts from the Hebrew Bible, and its concern with Torah observance reinterpreted through Jesus’ teachings.",
        "__CHAPTER_INTRO__",
        "Matthew's genealogy opens with an intricate numerical architecture: 14 generations from Abraham to David, 14 from David to the Babylonian exile, and 14 from the exile to Jesus—a structure deliberately built around the gematria of David's name (דוד = 14 in Hebrew). This symmetry comes at a historical cost: Matthew omits three kings (Ahaziah, Joash, and Amaziah) between Jehoram and Uzziah, double-counts Jeconiah at the exile boundary, and lists nine post-exilic ancestors who appear nowhere in the Old Testament. Most problematically, the genealogy traces Jesus's Davidic lineage through Joseph while simultaneously asserting in verses 18-25 that Joseph was not his biological father—creating a fundamental tension between the legal claim to messiahship and the virgin birth narrative. Matthew's genealogy thus reveals itself as a theological and literary construction, where numerical symbolism and christological claims take precedence over strict historical accuracy."
    ]
};

// --- Heading Data (Hardcoded for Demo/Key Chapters) ---
// Key: "Book Chapter:Verse" (1-indexed start verse for the section)
const HEADING_MAP: Record<string, string> = {
    "Matthew 1:1": "The Genealogy of Jesus Christ",
    "Matthew 1:18": "The Birth of Jesus Christ",
    "Matthew 2:1": "The Visit of the Wise Men",
    "Matthew 2:13": "The Flight to Egypt",
    "Matthew 2:16": "Herod Kills the Children",
    "Matthew 2:19": "The Return from Egypt",
    "Matthew 3:1": "John the Baptist Prepares the Way",
    "Matthew 3:13": "The Baptism of Jesus",
    "Matthew 4:1": "The Temptation of Jesus",
    "Matthew 4:12": "Jesus Begins His Ministry",
    "Matthew 4:18": "Jesus Calls the First Disciples",
    "Matthew 4:23": "Jesus Ministers to Great Crowds",
    "Matthew 5:1": "The Sermon on the Mount",
    "Matthew 5:2": "The Beatitudes",
};

// --- Detection Logic ---

// Detects typical KJV/WEB genealogy patterns
function isGenealogyVerse(text: string, bookName: string, chapterNum: number, verseNum: number): boolean {
    // SPECIAL CASE: Matthew 1:2-16 (Strict Range)
    if (bookName === 'Matthew' && chapterNum === 1) {
        return verseNum >= 2 && verseNum <= 16;
    }

    const lower = text.toLowerCase();
    // "begat" is the classic KJV indicator. "son of" is also common (Luke).
    // checking for density of names vs conjunctions is hard, but "begat" is a strong signal for Mat 1.
    if (lower.includes("begat")) return true;

    // For lists like "the son of X, the son of Y" (Luke 3)
    // We need a decent density or specific pattern to avoid false positives in narrative
    const sonOfCount = (lower.match(/son of/g) || []).length;
    if (sonOfCount > 1) return true; // At least 2 "son of" to be a list

    // WEB often uses "the father of"
    if (lower.includes("the father of") && lower.includes("became")) return true;

    return false;
}

// --- Processor ---

export function processChapterText(bookName: string, chapterNum: number, verses: ScriptureVerse[]): TextBlock[] {
    const blocks: TextBlock[] = [];
    let currentVerseBlock: ScriptureVerse[] = [];
    let currentGenealogyBlock: ScriptureVerse[] = [];

    const flushVerses = () => {
        if (currentVerseBlock.length > 0) {
            blocks.push({ type: 'verse', content: [...currentVerseBlock] });
            currentVerseBlock = [];
        }
    };

    const flushGenealogy = () => {
        if (currentGenealogyBlock.length > 0) {
            blocks.push({ type: 'genealogy', content: [...currentGenealogyBlock] });
            currentGenealogyBlock = [];
        }
    };

    const keyPrefix = `${bookName} ${chapterNum}`;

    // 0. Prepend Introduction / Prologue if available
    const introLines = INTRO_CONTENT[keyPrefix];
    if (introLines && introLines.length > 0) {
        let i = 0;
        while (i < introLines.length) {
            const line = introLines[i];
            if (line === '__BOOK_INTRO__') {
                if (i + 1 < introLines.length) {
                    blocks.push({ type: 'intro', subtype: 'book', content: introLines[i + 1] });
                    i += 2;
                } else { i++; }
            } else if (line === '__CHAPTER_INTRO__') {
                if (i + 1 < introLines.length) {
                    blocks.push({ type: 'intro', subtype: 'chapter', content: introLines[i + 1] });
                    i += 2;
                } else { i++; }
            } else {
                blocks.push({ type: 'intro', content: line });
                i++;
            }
        }
    }

    verses.forEach((verse) => {
        // 1. Check for Heading Injection BEFORE this verse
        const key = `${bookName} ${chapterNum}:${verse.num}`;
        if (HEADING_MAP[key]) {
            flushVerses();
            flushGenealogy(); // Genealogy usually doesn't span across a section break widely
            blocks.push({ type: 'heading', content: HEADING_MAP[key] });
        }

        // 2. Check content type
        if (isGenealogyVerse(verse.en, bookName, chapterNum, verse.num)) {
            flushVerses(); // If we were in normal text, stop.
            currentGenealogyBlock.push(verse);
        } else {
            // Normal text
            // If we were in a genealogy block, flush it
            flushGenealogy();
            currentVerseBlock.push(verse);
        }
    });

    // Final flush
    flushVerses();
    flushGenealogy();

    return blocks;
}
