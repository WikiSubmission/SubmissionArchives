const { createClient } = require('@supabase/supabase-js');

// --- CONFIG ---
const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error("Please set SUPABASE_KEY environment variable.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEntry() {
    console.log("Deleting study entry for Matthew 1:20...");

    const { error } = await supabase
        .from('study_entries')
        .delete()
        .eq('verse_ref', 'NT:Matthew:1:20');

    if (error) {
        console.error("Error deleting entry:", error);
    } else {
        console.log("Successfully deleted entry for NT:Matthew:1:20 (if it existed).");
    }
}

deleteEntry();
