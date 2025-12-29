
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- AUDIO SAMPLES ---");
    const { data: audios } = await supabase
        .from('media')
        .select('title')
        .eq('type', 'audio')
        .limit(5);
    console.log(JSON.stringify(audios, null, 2));

    console.log("\n--- SERMON SAMPLES ---");
    const { data: sermons } = await supabase
        .from('media')
        .select('title')
        .eq('type', 'sermon')
        .limit(5);
    console.log(JSON.stringify(sermons, null, 2));
}

check();
