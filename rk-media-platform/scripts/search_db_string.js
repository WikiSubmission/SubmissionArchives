const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function searchString() {
    const term = "FIRST SURA";
    console.log(`Searching for "%${term}%" in all columns...`);

    // Search Header
    const { data: hData, error: hError } = await supabase
        .from('quran_editions')
        .select('*')
        .ilike('header', `%${term}%`);

    if (hData && hData.length > 0) {
        console.log("FOUND IN HEADER:");
        hData.forEach(r => console.log(`  [${r.edition_key}] ${r.sura}:${r.verse} -> "${r.header}"`));
    } else {
        console.log("Not found in header.");
    }

    // Search Text
    const { data: tData, error: tError } = await supabase
        .from('quran_editions')
        .select('*')
        .ilike('text', `%${term}%`);

    if (tData && tData.length > 0) {
        console.log("FOUND IN TEXT:");
        tData.forEach(r => console.log(`  [${r.edition_key}] ${r.sura}:${r.verse} -> "${r.text}"`));
    } else {
        console.log("Not found in text.");
    }

    // Search Footnotes
    const { data: fData, error: fError } = await supabase
        .from('quran_editions')
        .select('*')
        .ilike('footnotes', `%${term}%`);

    if (fData && fData.length > 0) {
        console.log("FOUND IN FOOTNOTES:");
        fData.forEach(r => console.log(`  [${r.edition_key}] ${r.sura}:${r.verse} -> "${r.footnotes}"`));
    } else {
        console.log("Not found in footnotes.");
    }
}

searchString();
