export function cleanSefariaHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<i[^>]*>.*?<\/i>/gi, '') // Remove <i>...</i> content (often footnotes/variants)
        .replace(/<sup[^>]*>.*?<\/sup>/gi, '') // Remove <sup>...</sup> content
        .replace(/<small[^>]*>.*?<\/small>/gi, '') // Remove <small>...
        .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
        .replace(/&thinsp;/g, ' ') // Replace thin spaces
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/\{[פֿס]\}/g, '') // Remove {פ} and {ס} markers
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

export interface ScriptureChapter {
    ref: string;
    he: string[]; // Hebrew text array
    text: string[]; // English text array
    next?: string;
    prev?: string;
    book: string;
    chapter: number;
}

export type ScriptureSource = 'old-testament' | 'new-testament' | 'quran' | 'apocrypha';

export const BOOKS_OT = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Samuel I", "Samuel II", "Kings I", "Kings II",
    "Isaiah", "Jeremiah", "Ezekiel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Psalms", "Proverbs", "Job", "Song of Songs", "Ruth", "Lamentations", "Ecclesiastes", "Esther",
    "Daniel", "Ezra", "Nehemiah", "Chronicles I", "Chronicles II"
];

// Sefaria Apocrypha keys might vary, need verification. Using common ones.
export const BOOKS_APOCRYPHA = [
    "Tobit", "Judith", "Sirach", "Wisdom of Solomon", "Baruch", "Letter of Jeremiah", "Susanna", "Bel and the Dragon", "Maccabees I", "Maccabees II"
];

export async function fetchSefariaText(book: string, chapter: number): Promise<ScriptureChapter | null> {
    try {
        const ref = `${book}.${chapter}`;

        // Request JPS 1917 Version for English ONLY for OT to get Jewish translation
        // Apocrypha books likely won't have this version, so fall back to default for them.
        const isOT = BOOKS_OT.includes(book);
        const params = new URLSearchParams({
            context: '0',
            pad: '0'
        });

        if (isOT) {
            params.append('v', 'The Holy Scriptures: A New Translation (JPS 1917)');
        }

        const response = await fetch(`https://www.sefaria.org/api/texts/${ref}?${params.toString()}`);
        if (!response.ok) return null;

        const data = await response.json();

        // Sefaria returns 'he' (Hebrew) and 'text' (English) as arrays of strings (verses)
        // or sometimes strings if it's a single line, but for chapters it should be arrays.
        const rawText = Array.isArray(data.text) ? data.text : (data.text ? [data.text] : []);
        // Enhanced cleaning: remove everything in brackets [] or parenthesis () that looks like a note, 
        // though JPS 1917 is usually clean. Sefaria HTML tags are the main thing.
        const cleanedText = rawText.map((t: string) => cleanSefariaHtml(t));

        const rawHebrew = Array.isArray(data.he) ? data.he : (data.he ? [data.he] : []);
        const cleanedHebrew = rawHebrew.map((t: string) => cleanSefariaHtml(t));

        return {
            ref: data.ref,
            he: cleanedHebrew,
            text: cleanedText,
            next: data.next, // Use existing next/prev logic from Sefaria response if available
            prev: data.prev,
            book: data.book,
            chapter: chapter
        };
    } catch (e) {
        console.error("Sefaria Fetch Error:", e);
        return null;
    }
}
