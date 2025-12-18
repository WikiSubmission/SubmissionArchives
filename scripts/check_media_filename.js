
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('media')
        .select('id, title, type, local_filename')
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Sample Media Items:', JSON.stringify(data, null, 2));
    }
}

check();
