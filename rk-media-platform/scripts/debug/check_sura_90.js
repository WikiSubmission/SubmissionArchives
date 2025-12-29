const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function checkSura90() {
    console.log("Checking Sura 90:1 for 1981 edition...");

    const { data, error } = await supabase
        .from('quran_editions')
        .select('text')
        .eq('edition_key', '1981')
        .eq('sura', 90)
        .eq('verse', 1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Current Text in DB: "${data.text}"`);
        if (data.text.trim() === "I swear by this town.") {
            console.log("MATCH: User's edit IS in the database.");
        } else {
            console.log("MISMATCH: User's edit is NOT in the database.");
        }
    }
}

checkSura90();
