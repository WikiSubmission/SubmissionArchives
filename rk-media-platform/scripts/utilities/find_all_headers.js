const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function findAllHeaders() {
    console.log("Scanning ENTIRE table for headers...");

    // Fetch any row where header is not null
    const { data, error } = await supabase
        .from('quran_editions')
        .select('id, edition_key, sura, verse, header')
        .not('header', 'is', null)
        .neq('header', '');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} verses with headers.`);

    // Group by edition
    const counts = {};
    data.forEach(v => {
        counts[v.edition_key] = (counts[v.edition_key] || 0) + 1;
    });

    console.log("Counts by Edition:", counts);

    // List some samples from 90-114 if they exist
    const rangeSamples = data.filter(v => v.sura >= 90 && v.sura <= 114);
    console.log(`\nHeaders in Sura 90-114 range: ${rangeSamples.length}`);
    rangeSamples.forEach(v => {
        console.log(`[${v.edition_key}] ${v.sura}:${v.verse} -> "${v.header}"`);
    });
}

findAllHeaders();
