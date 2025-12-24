
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const targetId = '54fb822f-6375-4bfc-ab57-27735973846b';
    console.log(`Inspecting specific media ID: ${targetId}`);

    // Fetch unique speakers to help with pattern matching
    // Note: .distinct() is not directly available on simple select without RPC or post-processing?
    // We'll just fetch a sample or we can use .select('speaker') and Set in JS.
    const { data: allSegments } = await supabase
        .from('transcript_segments')
        .select('speaker')
        .limit(10000);

    const knownSpeakers = new Set(allSegments?.map(s => s.speaker).filter(Boolean));
    console.log('Known speakers (sample):', [...knownSpeakers]);

    const { data: segments, error: segError } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('media_id', targetId)
        .order('segment_index');

    if (segError) {
        console.error('Error fetching segments:', segError);
        return;
    }

    console.log(`Fetched ${segments?.length} segments for target media.`);

    // Specific issue search
    const issue = segments?.find(s => s.content.includes("Sura 26") && s.content.includes("Edip:"));
    if (issue) {
        console.log('\nFOUND REPORTED ISSUE:');
        console.log(`[${issue.start_time} - ${issue.end_time}] Index: ${issue.segment_index} | Speaker: ${issue.speaker}`);
        console.log(`Content: ${issue.content}`);
    } else {
        console.log('\nReported issue "Sura 26 ... Edip:" NOT FOUND in exact string match. Checking partials...');
        const partial = segments?.filter(s => s.content.includes("Edip:"));
        partial?.forEach(s => {
            console.log(`\nPartial Match [${s.start_time}] ${s.segment_index}: ${s.content}`);
        });
    }

    // Broad search for merged speakers using regex logic
    // Pattern: Name: Text
    // We'll use the known speakers list to refine regex if needed, or just generic Capitalized Name:
    const regex = /([A-Z][a-zA-Z\s\.]+):/g;
    let potentialMerges = 0;
    segments?.forEach(s => {
        const matches = s.content.match(regex);
        if (matches && matches.length > 0) {
            // Filter out if the match is at the very beginning (which would be redundant to `speaker` field but maybe imported that way?)
            // Actually content should not have "Speaker:" prefix if it's in `speaker` column.
            // But here we look for "Edip:" inside the text.
            const internalMatches = matches.filter((m: string) => s.content.indexOf(m) > 0);
            if (internalMatches.length > 0) {
                potentialMerges++;
            }
        }
    });
    console.log(`\nTotal potential merged segments detected in this file: ${potentialMerges}`);
}

main();
