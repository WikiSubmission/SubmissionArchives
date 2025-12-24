const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function dump90_1() {
    console.log("Dumping Sura 90:1 for ALL editions...");

    const { data, error } = await supabase
        .from('quran_editions')
        .select('*')
        .eq('sura', 90)
        .eq('verse', 1);

    if (error) {
        console.error("Error:", error);
    } else {
        data.forEach(row => {
            console.log(`\nEdition: [${row.edition_key}]`);
            console.log(`ID: ${row.id}`);
            console.log(`Text: "${row.text}"`);
            console.log(`Header: "${row.header}"`);
        });
    }
}

dump90_1();
