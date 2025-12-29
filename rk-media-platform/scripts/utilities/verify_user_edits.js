const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function verifyEdits() {
    console.log("Verifying edits for Surahs 90-114...");

    const editions = ['1981', '1989', 'revision'];

    for (const edition of editions) {
        // Count total verses
        const { count: total, error: err1 } = await supabase
            .from('quran_editions')
            .select('*', { count: 'exact', head: true })
            .eq('edition_key', edition)
            .gte('sura', 90)
            .lte('sura', 114);

        if (err1) { console.error(err1); continue; }

        // Count verses with headers
        const { count: withHeader, error: err2 } = await supabase
            .from('quran_editions')
            .select('*', { count: 'exact', head: true })
            .eq('edition_key', edition)
            .gte('sura', 90)
            .lte('sura', 114)
            .not('header', 'is', null)
            .neq('header', '');

        if (err2) { console.error(err2); continue; }

        console.log(`[${edition}] Surahs 90-114: ${total} verses. Headers found: ${withHeader}`);

        if (withHeader > 0) {
            const { data: headers, error: errH } = await supabase
                .from('quran_editions')
                .select('sura, verse, header')
                .eq('edition_key', edition)
                .gte('sura', 90)
                .lte('sura', 114)
                .neq('header', null)
                .neq('header', '');

            if (!errH) {
                console.log(`    Headers present in: ${headers.map(h => `${h.sura}:${h.verse}`).join(', ')}`);
                console.log(`    Sample Header: "${headers[0].header}"`);
            }
        }

        // Check footnotes
        const { count: withFootnote, error: errF } = await supabase
            .from('quran_editions')
            .select('*', { count: 'exact', head: true })
            .eq('edition_key', edition)
            .gte('sura', 90)
            .lte('sura', 114)
            .not('footnotes', 'is', null)
            .neq('footnotes', '');

        console.log(`    Footnotes found: ${withFootnote}`);

        // Check text sample for 93:1 and 112:1
        const { data: textSamples } = await supabase
            .from('quran_editions')
            .select('sura, verse, text')
            .eq('edition_key', edition)
            .in('sura', [93, 112])
            .eq('verse', 1);

        textSamples?.forEach(t => {
            console.log(`    ${t.sura}:${t.verse} Text: "${t.text}"`);
        });
    }
}

verifyEdits();
