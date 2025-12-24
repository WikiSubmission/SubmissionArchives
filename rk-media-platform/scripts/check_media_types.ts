
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Get distinct types
    const { data, error } = await supabase
        .from('media')
        .select('type'); // Supabase JS doesn't have .distinct() easily without rpc or raw sql usually, but let's try just fetching types and uniqueing in JS for this small dataset

    if (error) {
        console.error('Error:', error);
    } else {
        const types = [...new Set(data.map(d => d.type))];
        console.log('Distinct Media Types:', types);

        // Also check if there's a different table for newsletters?
        // We can't easily list tables, so we'll just stick to this for now.
    }
}

main();
