
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJuly1987() {
    console.log("Searching for July 1987 sermons...");
    const { data, error } = await supabase
        .from('media')
        .select('id, title, type, duration_seconds')
        .ilike('title', '%July%1987%');

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(item => {
        console.log(`\nID: ${item.id}`);
        console.log(`Title: ${item.title}`);
        console.log(`Duration: ${item.duration_seconds}s`);
    });
}

checkJuly1987();
