const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load config
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

try {
    const config = require('./config.js');
    if (!supabaseUrl) supabaseUrl = config.supabaseUrl;
    if (!supabaseServiceKey) supabaseServiceKey = config.supabaseServiceKey;
} catch (e) { }

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Config. Ensure ./config.js exists with service key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadDirectory(dirPath, editionKey) {
    console.log(`Scanning directory: ${dirPath} for edition: ${editionKey}`);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

    let totalVerses = 0;
    const allVerses = [];

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        // console.log(`Reading ${file}...`);
        try {
            const raw = fs.readFileSync(fullPath, 'utf-8');
            const data = JSON.parse(raw);

            // Format check: Array of verses
            if (Array.isArray(data)) {
                const mapped = data.map(item => ({
                    edition_key: editionKey,
                    sura: item.chapter_number,
                    verse: item.verse_number,
                    text: item.verse_text_english || item.text, // Fallback if schema varies slightly
                    footnotes: null
                }));
                allVerses.push(...mapped);
            }
        } catch (err) {
            console.error(`Error reading ${file}:`, err.message);
        }
    }

    console.log(`Found ${allVerses.length} total verses across ${files.length} files.`);
    await uploadBatch(allVerses, editionKey);
}

async function uploadUnifiedFile(filePath) {
    console.log(`Reading single file: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    const verses = data.map(item => ({
        edition_key: 'revision',
        sura: item.chapter_number,
        verse: item.verse_number,
        text: item.verse_text_english,
        footnotes: item.verse_footnote_english || null,
        header: item.verse_subtitle_english || null
    }));

    await uploadBatch(verses, 'revision');
}

async function uploadBatch(verses, editionKey) {
    // Deduplicate verses based on sura:verse
    const seen = new Set();
    const uniqueVerses = [];

    for (const v of verses) {
        const key = `${v.sura}:${v.verse}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueVerses.push(v);
        }
    }

    console.log(`Uploading ${uniqueVerses.length} unique verses for ${editionKey} (Original: ${verses.length})...`);
    const batchSize = 100;

    for (let i = 0; i < uniqueVerses.length; i += batchSize) {
        const batch = uniqueVerses.slice(i, i + batchSize);
        const { error } = await supabase.from('quran_editions').upsert(batch, {
            onConflict: 'edition_key,sura,verse'
        });

        if (error) {
            console.error(`Error batch ${i}:`, error.message);
        } else {
            if (i % 1000 === 0) console.log(`Processed ${i} / ${uniqueVerses.length}`);
        }
    }
    console.log(`✅ Finished ${editionKey}`);
}

const args = process.argv.slice(2);
const edition = args[0];
const pathArg = args[1];

if (!edition || !pathArg) {
    console.log('Usage: node upload_quran_custom.js <1981|1989|revision> <path>');
    process.exit(1);
}

const stats = fs.statSync(pathArg);

if (stats.isDirectory()) {
    uploadDirectory(pathArg, edition);
} else {
    uploadUnifiedFile(pathArg); // Assume revision single file if file
}
