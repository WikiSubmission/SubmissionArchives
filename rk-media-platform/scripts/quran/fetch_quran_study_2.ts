import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://uxirypbshphzvdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const targetId = '09b9fcbd-8511-4b20-bb6f-eb483adb6ea6'; // 2) Quran Study 8/4/89
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

    fs.writeFileSync('quran_study_2_transcript.json', JSON.stringify(segments, null, 2));
    console.log('Transcript saved to quran_study_2_transcript.json');
}

main();
