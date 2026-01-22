
/**
 * specific implementation of a phonetic algorithm (Simplified Metaphone)
 * to avoid heavy dependencies while providing better-than-soundex matching.
 */

export function getPhoneticCode(word: string): string {
    let code = word.toUpperCase();

    // 1. Drop non-alphabetic characters
    code = code.replace(/[^A-Z]/g, '');

    if (code.length === 0) return '';

    // 2. Handle initial letters exceptions
    if (code.startsWith('KN') || code.startsWith('GN') || code.startsWith('PN') || code.startsWith('AE') || code.startsWith('WR')) {
        code = code.substring(1);
    }

    // 3. Transformations
    let ph = '';
    const len = code.length;

    // Loop through string
    for (let i = 0; i < len; i++) {
        const c = code[i];
        const next = code[i + 1] || '';
        const prev = code[i - 1] || '';

        // Skip duplicates (except C)
        if (c === prev && c !== 'C') continue;

        switch (c) {
            case 'A': case 'E': case 'I': case 'O': case 'U':
                if (i === 0) ph += c; // Keep first vowel
                break;
            case 'B':
                if (prev === 'M' && i === len - 1) break; // Dumb -> Dum
                ph += 'B';
                break;
            case 'C':
                if (next === 'H') {
                    ph += 'X'; // Ch -> X
                    i++;
                } else if (next === 'I' || next === 'E' || next === 'Y') {
                    ph += 'S'; // Ci/Ce -> S
                } else {
                    ph += 'K'; // Ca/Cu/Co -> K
                }
                break;
            case 'D':
                if (next === 'G' && (code[i + 2] === 'E' || code[i + 2] === 'I' || code[i + 2] === 'Y')) {
                    ph += 'J'; // Edge -> Ej
                    i += 2;
                } else {
                    ph += 'T';
                }
                break;
            case 'F':
                ph += 'F';
                break;
            case 'G':
                if (next === 'H') {
                    if (i > 0 && !(code[i - 2] === 'A' || code[i - 2] === 'E' || code[i - 2] === 'I' || code[i - 2] === 'O' || code[i - 2] === 'U')) {
                        ph += 'F'; // Laugh -> Laf (Simplified)
                    } else {
                        // Silent GH
                    }
                    i++;
                } else if (next === 'N' || (next === 'N' && i === len - 2)) {
                    // Sign -> Sin
                    ph += 'N';
                } else if (next === 'I' || next === 'E' || next === 'Y') {
                    // Gem -> Jem (Simplified, gets 'Get' wrong but acceptable for fuzzy)
                    ph += 'J';
                } else {
                    ph += 'K';
                }
                break;
            case 'H':
                // Keeping H if starting or after vowel, otherwise silent if after consonant
                if (i === 0 || 'AEIOU'.includes(prev)) ph += 'H';
                break;
            case 'J':
                ph += 'J';
                break;
            case 'K':
                if (prev !== 'C') ph += 'K';
                break;
            case 'L':
                ph += 'L';
                break;
            case 'M':
                ph += 'M';
                break;
            case 'N':
                ph += 'N';
                break;
            case 'P':
                if (next === 'H') {
                    ph += 'F';
                    i++;
                } else {
                    ph += 'P';
                }
                break;
            case 'Q':
                ph += 'K';
                break;
            case 'R':
                ph += 'R';
                break;
            case 'S':
                if (next === 'H') {
                    ph += 'X';
                    i++;
                } else {
                    ph += 'S';
                }
                break;
            case 'T':
                if (next === 'H') {
                    ph += '0'; // Theta -> 0
                    i++;
                } else if (next === 'I' && (code[i + 2] === 'O' || code[i + 2] === 'A')) {
                    ph += 'X'; // Nation -> Naxion
                } else {
                    ph += 'T';
                }
                break;
            case 'V':
                ph += 'F';
                break;
            case 'W': case 'Y':
                if (i === 0) ph += c; // Keep if first
                break;
            case 'X':
                ph += 'KS';
                break;
            case 'Z':
                ph += 'S';
                break;
        }
    }

    return ph;
}
