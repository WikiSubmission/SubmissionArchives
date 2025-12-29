const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\Jonathan\\Desktop\\RKM\\QURAN TRANSLATIONS\\1992 Quran.json";
const raw = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

console.log("Checking 1992 Quran.json for subtitles in Surahs 90-114...");
const subtitles = data.filter(v => v.chapter_number >= 90 && v.chapter_number <= 114 && v.verse_subtitle_english);

console.log(`Found ${subtitles.length} subtitles.`);
subtitles.forEach(v => {
    console.log(`[${v.chapter_number}:${v.verse_number}] ${v.verse_subtitle_english}`);
});
