
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: media, error } = await supabase
        .from('media')
        .select('title, youtube_id')
        .not('youtube_id', 'is', null) // Only show ones with youtube_id
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Media with YouTube IDs:', media);

        // Count total vs total with YT
        const { count: total } = await supabase.from('media').select('*', { count: 'exact', head: true });
        const { count: withYt } = await supabase.from('media').select('*', { count: 'exact', head: true }).not('youtube_id', 'is', null);
        console.log(`Total Media: ${total}, With YouTube: ${withYt}`);
    }
}

main();
