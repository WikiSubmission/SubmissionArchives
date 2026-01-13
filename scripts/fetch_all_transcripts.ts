import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const studies = JSON.parse(fs.readFileSync('all_quran_studies.json', 'utf8')).byTitle;
    const outputDir = 'transcripts';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    for (const study of studies) {
        console.log(`Fetching: ${study.title} (${study.id})...`);
        const { data: segments, error } = await supabase
            .from('transcript_segments')
            .select('*')
            .eq('media_id', study.id)
            .order('segment_index');

        if (error) {
            console.error(`Error fetching ${study.id}:`, error);
            continue;
        }

        if (segments && segments.length > 0) {
            fs.writeFileSync(path.join(outputDir, `${study.id}.json`), JSON.stringify(segments, null, 2));
            console.log(`Saved ${segments.length} segments.`);
        } else {
            console.log(`No transcript found for ${study.id}.`);
        }
    }
}

main();
