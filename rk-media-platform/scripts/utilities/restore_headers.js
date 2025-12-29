const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
const filePath = "C:\\Users\\Jonathan\\Desktop\\RKM\\QURAN TRANSLATIONS\\1992 Quran.json";

async function restoreHeaders() {
    console.log("Restoring headers from 1992 Quran.json...");
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    // Map of Sura Number -> Chapter Title
    const titleMap = {};
    data.forEach(v => {
        if (!titleMap[v.chapter_number]) {
            titleMap[v.chapter_number] = v.chapter_title_english;
        }
    });

    const editions = ['1981', '1989', 'revision'];
    const startSura = 90;
    const endSura = 114;

    for (const sura of Object.keys(titleMap)) {
        if (sura < startSura || sura > endSura) continue;

        const title = titleMap[sura];
        console.log(`Restoring Header for Sura ${sura}: "${title}"`);

        for (const edition of editions) {
            // Apply to Verse 1 (or 0 if exists, but typically headers go on likely Verse 1 or top)
            // Let's check if Verse 0 exists for this sura, if so put it there, else Verse 1.
            // Actually, for consistency, let's put it on the first available verse of the sura.

            const { data: firstVerse } = await supabase
                .from('quran_editions')
                .select('verse')
                .eq('edition_key', edition)
                .eq('sura', sura)
                .order('verse')
                .limit(1)
                .single();

            if (firstVerse) {
                const { error } = await supabase
                    .from('quran_editions')
                    .update({ header: title })
                    .eq('edition_key', edition)
                    .eq('sura', sura)
                    .eq('verse', firstVerse.verse);

                if (error) console.error(`Error updating ${edition} ${sura}:`, error);
            }
        }
    }
    console.log("Header restoration complete.");
}

restoreHeaders();
