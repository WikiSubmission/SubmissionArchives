const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid 'dotenv' dependency
function loadEnv(filePath) {
    try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, 'utf-8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    process.env[key] = value;
                }
            });
            console.log(`Loaded env from ${filePath}`);
        }
    } catch (e) {
        console.warn(`Could not load ${filePath}`);
    }
}

// Load environment variables
loadEnv('.env.local');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback to local config if env missing
try {
    const config = require('./config.js');
    if (!supabaseUrl) supabaseUrl = config.supabaseUrl;
    if (!supabaseServiceKey) supabaseServiceKey = config.supabaseServiceKey;
} catch (e) { }

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadEdition(filePath, editionKey) {
    console.log(`Reading ${filePath}...`);

    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const verses = JSON.parse(rawData);

        if (!Array.isArray(verses)) {
            throw new Error('JSON data must be an array of verses');
        }

        console.log(`Deleting existing entries for '${editionKey}'...`);
        const { error: deleteError } = await supabase
            .from('quran_editions')
            .delete()
            .eq('edition_key', editionKey);

        if (deleteError) {
            console.error('Error clearing old data:', deleteError);
            // Decide if you want to stop or continue. 
            // Often if table is empty it might not error, but let's just log.
        }

        // Deduplicate based on sura/verse
        const uniqueVerses = [];
        const seen = new Set();
        verses.forEach(v => {
            const s = v.sura || v.chapter_number;
            const ve = v.verse || v.verse_number;
            const key = `${s}:${ve}`;
            if (!seen.has(key)) {
                seen.add(key);
                // Standardize keys here while we're at it
                uniqueVerses.push({
                    sura: s,
                    verse: ve,
                    text: v.text,
                    footnotes: v.footnotes
                });
            }
        });

        console.log(`Found ${verses.length} raw entries. Deduplicated to ${uniqueVerses.length} unique verses.`);
        console.log(`Uploading to '${editionKey}'...`);

        const batchSize = 100;
        for (let i = 0; i < uniqueVerses.length; i += batchSize) {
            const batch = uniqueVerses.slice(i, i + batchSize).map(v => ({
                edition_key: editionKey,
                sura: v.sura,
                verse: v.verse,
                text: v.text,
                footnotes: v.footnotes || null
            }));

            const { error } = await supabase.from('quran_editions').upsert(batch, {
                onConflict: 'edition_key,sura,verse'
            });

            if (error) {
                console.error(`Error uploading batch ${i}:`, error);
            } else {
                console.log(`Uploaded batch ${i} - ${i + batch.length}`);
            }
        }

        console.log(`✅ Upload complete for ${editionKey}`);

    } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
    }
}

// Usage example:
// node scripts/upload_quran_editions.js ./path/to/1981.json 1981
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node scripts/upload_quran_editions.js <json_file_path> <edition_key>');
    process.exit(0);
}

const [filePath, editionKey] = args;
uploadEdition(filePath, editionKey);
