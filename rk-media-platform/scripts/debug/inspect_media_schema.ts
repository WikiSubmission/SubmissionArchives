
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Get one row but show ALL keys
    const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (media && media.length > 0) {
        console.log('--- COLUMNS ---');
        Object.keys(media[0]).forEach(k => console.log(k));
        console.log('--- SAMPLE VALUES (Select) ---');
        const m = media[0];
        // Print values that look like URLs
        Object.keys(m).forEach(k => {
            const v = m[k];
            if (typeof v === 'string' && (v.startsWith('http') || v.includes('www'))) {
                console.log(`${k}: ${v}`);
            }
        });
    } else {
        console.log('No media rows found.');
    }

    // Check for other tables?
    // Supabase JS doesn't easily list tables without admin, 
    // but maybe we can guess or just rely on media.
}

main();
