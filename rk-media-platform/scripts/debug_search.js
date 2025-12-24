
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
    console.log("Testing search query...");
    const query = "salat";
    const typeFilters = ['sermon', 'quran-study', 'video-program', 'audio', 'messenger-audio'];

    const { data, error } = await supabase
        .from('transcript_segments')
        .select(`
            id,
            content,
            start_time,
            media!inner (
                id,
                title,
                type,
                created_at,
                local_filename,
                duration_seconds
            )
        `)
        .ilike('content', `%${query}%`)
        .in('media.type', typeFilters)
        .limit(5);

    if (error) {
        console.error("SEARCH ERROR FOUND:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log(`Success! Found ${data.length} matches.`);
        if (data.length > 0) {
            console.log("Sample:", JSON.stringify(data[0], null, 2));
        }
    }
}

testSearch();
