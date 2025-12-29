
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const targetId = 'a3778000-dcde-4545-983b-f79a957262ba';
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

    fs.writeFileSync('quran_study_candidate_2_transcript.json', JSON.stringify(segments, null, 2));
    console.log('Transcript saved to quran_study_candidate_2_transcript.json');
}

main();
