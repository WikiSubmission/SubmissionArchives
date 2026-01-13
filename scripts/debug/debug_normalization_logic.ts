
// Construct the title string from observed char codes
// "9) Quran Study 5⧸12⧸89..."
// We focus on the date part which caused issues.
// 5 = 53
// ⧸ = 10744
// 1 = 49
// 2 = 50
// ⧸ = 10744
// 8 = 56
// 9 = 57

const weirdChar = String.fromCharCode(10744);
const rawPart = `5${weirdChar}12${weirdChar}89`;
console.log(`Raw Part: ${rawPart}`);
console.log(`Raw Codes: ${rawPart.split('').map(c => c.charCodeAt(0))}`);

// Test Regex 1: Literal char in regex
const regex1 = /⧸/g;
const norm1 = rawPart.replace(regex1, '/');
console.log(`Norm 1 (Literal): ${norm1}`);
console.log(`Norm 1 Codes: ${norm1.split('').map(c => c.charCodeAt(0))}`);

// Test Regex 2: Unicode escape
const regex2 = /\u29F8/g; // 0x29F8 = 10744
const norm2 = rawPart.replace(regex2, '/');
console.log(`Norm 2 (Unicode): ${norm2}`);
console.log(`Norm 2 Codes: ${norm2.split('').map(c => c.charCodeAt(0))}`);

if (norm1.includes('/') && norm2.includes('/')) {
    console.log("SUCCESS: Both regexes work.");
} else {
    console.log("FAILURE: Regex did not replace char.");
}
