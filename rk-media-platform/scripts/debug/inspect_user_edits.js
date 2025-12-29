const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function inspectEdits() {
    console.log("Inspecting content for verification...");

    const editions = ['1981', '1989', 'revision'];
    const surahsToCheck = [114, 90]; // Last and first of the range

    for (const sura of surahsToCheck) {
        console.log(`\n=== SURA ${sura} ===`);
        for (const edition of editions) {
            console.log(`  -- ${edition} --`);
            const { data, error } = await supabase
                .from('quran_editions')
                .select('verse, text, header, footnotes')
                .eq('edition_key', edition)
                .eq('sura', sura)
                .order('verse');

            if (error) {
                console.error(error);
                continue;
            }

            // Show first 3 verses
            data.slice(0, 3).forEach(v => {
                const head = v.header ? ` [HEADER: "${v.header}"]` : "";
                const foot = v.footnotes ? ` [NOTE: "${v.footnotes.substring(0, 20)}..."]` : "";
                console.log(`    ${sura}:${v.verse}${head} -> ${v.text.substring(0, 60)}...${foot}`);
            });
        }
    }
}

inspectEdits();
