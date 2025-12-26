
import { STUDY_TITLES } from '../src/lib/studyTitles';

// Construct raw title: '9) Quran Study 5⧸12⧸89, Sura 70 by Edip, Chastity, worry, Edip wanted Rashad Khalifa to change ....mp3'
// Based on previous logs and assumption of filename.
// ⧸ = 10744
const weirdSlash = String.fromCharCode(10744);
// Note: The specific filename string might need to be exact. 
// I'll use the one I saw in the logs (partial): "9) Quran Study 5⧸12⧸89, Sura 70 by Edip, Chastity, worry, Edip wanted Rashad Khalifa to change ....mp3"
// Wait, I need the EXACT string from the studyTitles file before normalization to ensure I'm testing the right target.
// But I replaced the file content.
// I can rely on the fact that I know the date part was problematic.

const rawTitle = `9) Quran Study 5${weirdSlash}12${weirdSlash}89, Sura 70 by Edip, Chastity, worry, Edip wanted Rashad Khalifa to change ....mp3`;

console.log("Raw Title constructed:", rawTitle);

// Logic being tested (copied from formatUtils.ts)
const normalizedTitle = rawTitle
    .toLowerCase()
    .replace(/⧸/g, '/')
    .replace(/\u00A0/g, ' ')
    .replace(/['’‘]/g, "'")
    .replace(/["“”]/g, '"')
    .replace(/[-–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

console.log("Normalized Title:", normalizedTitle);

if (STUDY_TITLES[normalizedTitle]) {
    console.log("MATCH SUCCESS:", STUDY_TITLES[normalizedTitle]);
} else {
    console.log("MATCH FAILED");

    // Find closest key
    const keys = Object.keys(STUDY_TITLES);
    // Search for the date part which should be '5/12/89'
    const partialKey = '5/12/89';
    const closest = keys.find(k => k.includes(partialKey));

    if (closest) {
        console.log("Closest Key found in Map:", closest);

        // Character by character code comparison
        console.log("\nComparison:");
        const maxLen = Math.max(closest.length, normalizedTitle.length);
        for (let i = 0; i < maxLen; i++) {
            const code1 = normalizedTitle.charCodeAt(i);
            const char1 = normalizedTitle[i] || 'EOF';
            const code2 = closest.charCodeAt(i);
            const char2 = closest[i] || 'EOF';

            if (code1 !== code2) {
                console.log(`Mismatch at index ${i}: Input='${char1}'(${code1}) vs Key='${char2}'(${code2})`);
            }
        }
    } else {
        console.log("No key found with date", partialKey);
        console.log("First 5 keys:", keys.slice(0, 5));
    }
}
