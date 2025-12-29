import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const targetId = '0d4a7f7d-54f0-4bcc-890c-844ad3e958f8';
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

    console.log(`Fetched ${segments.length} segments.`);

    // Output all segments to a file for analysis
    fs.writeFileSync('quran_study_1_transcript.json', JSON.stringify(segments, null, 2));
    console.log('Transcript saved to quran_study_1_transcript.json');
}

main();
