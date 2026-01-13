
import { createClient } from '@supabase/supabase-js';

// Credentials from previous session context
const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking "media" table...');
    const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching media:', error);
    } else {
        console.log('Sample Media Row:', media[0]);
    }

    console.log('\nChecking Storage Buckets...');
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError);
    } else {
        console.log('Buckets:', buckets);
    }
}

main();
