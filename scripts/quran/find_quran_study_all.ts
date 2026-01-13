
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Fetching all Quran Study titles...');

    const { data: quranStudies, error } = await supabase
        .from('media')
        .select('id, title, created_at')
        .eq('type', 'quran-study');

    if (error) {
        console.error('Error fetching quran studies:', error);
        return;
    }

    const sortedByTitle = [...quranStudies].sort((a, b) => a.title.localeCompare(b.title));
    const sortedByDate = [...quranStudies].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    fs.writeFileSync('all_quran_studies.json', JSON.stringify({
        byTitle: sortedByTitle,
        byDate: sortedByDate
    }, null, 2));

    console.log(`Saved ${quranStudies.length} studies to all_quran_studies.json`);
}

main();
