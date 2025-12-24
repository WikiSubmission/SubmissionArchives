
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Searching for all Quran Study candidates...');

    const { data: quranStudies, error } = await supabase
        .from('media')
        .select('id, title, type, created_at')
        .eq('type', 'quran-study');

    if (error) {
        console.error('Error fetching quran studies:', error);
        return;
    }

    console.log(`Found ${quranStudies.length} Quran Studies.`);

    // 1. Exact match for "Quran Study 1"
    const candidates = quranStudies.filter(m =>
        m.title.toLowerCase().includes('quran study 1') ||
        m.title.toLowerCase().includes('quran study no.1') ||
        m.title.toLowerCase().includes('quran study no. 1') ||
        m.title.match(/^1\)\s/) || // Starts with "1) "
        m.title.includes('Study 1')
    );

    console.log('Candidates found:', candidates.length);
    candidates.forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));

    // Also look for chronological first
    const sorted = [...quranStudies].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    console.log('Chronological Earliest Study:', sorted[0]?.title, '(ID:', sorted[0]?.id, ')');

    // If we have candidates, pick the best one or fetch all.
    // For now, let's pick the one that is literally "Quran Study 1" if it exists.
    let best = candidates.find(c => c.title.toLowerCase().includes('quran study 1')) || sorted[0];

    if (best) {
        console.log(`Fetching segments for: ${best.title} (${best.id})`);
        const { data: segments, error: segError } = await supabase
            .from('transcript_segments')
            .select('*')
            .eq('media_id', best.id)
            .order('segment_index');

        if (segError) {
            console.error('Error fetching segments:', segError);
            return;
        }

        fs.writeFileSync('quran_study_analysis_transcript.json', JSON.stringify({
            media: best,
            segments: segments
        }, null, 2));
        console.log('Data saved to quran_study_analysis_transcript.json');
    }
}

main();
