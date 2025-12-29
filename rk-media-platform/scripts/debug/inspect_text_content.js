const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function inspectTextContent() {
    console.log("Inspecting Verse Text for embedded headers...");

    // Check Sura 96:1 and 114:1 for all editions
    const { data, error } = await supabase
        .from('quran_editions')
        .select('edition_key, sura, verse, text')
        .in('sura', [96, 114])
        .eq('verse', 1);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(v => {
        console.log(`[${v.edition_key}] ${v.sura}:${v.verse}`);
        console.log(`  TEXT: "${v.text}"`);
        console.log('---');
    });
}

inspectTextContent();
