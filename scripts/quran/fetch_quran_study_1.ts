
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const targetId = '86de7dd1-e456-42ab-8e3e-7070e26cdb3e';
    console.log(`Fetching segments for media ID: ${targetId}`);

    const { data: segments, error } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('media_id', targetId)
        .order('segment_index');

    if (error) {
        console.error('Error fetching segments:', error);
        return;
    }

    fs.writeFileSync('quran_study_1_correct_transcript.json', JSON.stringify(segments, null, 2));
    console.log('Transcript saved to quran_study_1_correct_transcript.json');
}

main();
