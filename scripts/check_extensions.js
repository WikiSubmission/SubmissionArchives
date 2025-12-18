
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase
        .from('media')
        .select('local_filename')
        .eq('type', 'quran-study')
        .limit(5);

    if (data) {
        data.forEach(row => {
            console.log("FILENAME:", row.local_filename);
        });
    }
}

check();
