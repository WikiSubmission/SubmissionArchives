
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'sb_secret_4xeP9a_RxUZrdZ5fI0xVxA_d9hZY4ZE'
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuration
const TARGET_MEDIA_ID = ''; // Empty to scan all
const DRY_RUN = false; // Set to false to apply changes

async function main() {
    console.log(`Starting Transcript Fixer...`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (No changes applied)' : 'LIVE (Applying changes)'}`);



    // 1. Get all media IDs
    console.log('Fetching list of media...');
    let mediaIds: string[] = [];
    if (TARGET_MEDIA_ID) {
        mediaIds = [TARGET_MEDIA_ID];
    } else {
        const { data: allMedia, error: mediaError } = await supabase.from('media').select('id');
        if (mediaError) {
            console.error('Error fetching media list:', mediaError);
            return;
        }
        mediaIds = allMedia.map(m => m.id);
    }

    // 2. Build Known Speaker Whitelist
    console.log('Building known speaker whitelist...');
    // Fetch all speakers. This might be heavy, so we can try to fetch unique if possible or just all and dedupe.
    // Supabase JS doesn't do distinct easily on select without .csv() or rpc. 
    // We'll fetch just speaker column. 100k rows of "speaker" is small (~2MB).
    const { data: allSpeakersData, error: speakerError } = await supabase
        .from('transcript_segments')
        .select('speaker'); // We'll assume this fits in memory.

    if (speakerError) {
        console.error('Error fetching speakers:', speakerError);
        return;
    }

    const speakerSet = new Set<string>();
    allSpeakersData?.forEach(s => {
        if (s.speaker) speakerSet.add(s.speaker.trim());
    });

    // Add known hardcoded ones if missing (optional)
    speakerSet.add("Edip");
    speakerSet.add("Dr. Khalifa");

    // Sort by length descending to match longest names first in regex (e.g. "Dr. Rashad Khalifa" before "Dr. Rashad")
    const sortedSpeakers = Array.from(speakerSet).sort((a, b) => b.length - a.length);
    console.log(`Found ${sortedSpeakers.length} unique speakers.`);

    // Create specific regex from speakers
    // Escape special regex chars
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const speakerPattern = sortedSpeakers.map(s => escapeRegExp(s)).join('|');
    const strictRegex = new RegExp(`(${speakerPattern}):`, 'g');

    console.log(`Regex built with ${sortedSpeakers.length} names.`);

    let totalUpdated = 0;

    for (const mediaId of mediaIds) {
        console.log(`Processing Media ID: ${mediaId}...`);
        await processMedia(mediaId, strictRegex);
    }

    console.log('All media processed.');
}

async function processMedia(mediaId: string, regex: RegExp) {
    // Fetch ALL segments for this media
    // We assume < 10,000 segments per media for simplicity.
    const { data: segments, error } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('media_id', mediaId)
        .order('segment_index')
        .limit(10000);

    if (error) {
        console.error(`Error fetching segments for ${mediaId}:`, error);
        return;
    }

    if (!segments || segments.length === 0) {
        // console.log(`No segments for ${mediaId}`);
        return;
    }

    let newSegmentsBatch: any[] = [];
    let nextIndex = 0;
    let changesCount = 0;

    for (const segment of segments) {
        const content = segment.content;

        // Reset regex state for each segment string
        regex.lastIndex = 0;

        const matches: RegExpExecArray[] = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            matches.push(match);
        }

        // Filter out matches at index 0 because that's just the current speaker label (redundant)
        // OR is it? "Name: Text". If the text STARTS with "Name:", it might be a labeling artifact content.
        // But usually content text shouldn't contain the speaker name of ITSELF.
        // If content is "Edip: Hello", and speaker is "Edip", then "Edip: Hello" is redundant content.
        // If content is "Dr. Khalifa: Yes", and speaker is "Edip", that's a merge.
        // If match.index == 0, check if matched name != current speaker.

        const splitPoints = matches.filter(m => {
            if (m.index === 0) {
                // Check if the name found is different from the current segment speaker
                // If segment.speaker is "Edip" and content starts with "Edip:", it's redundant but not a split (just clean up?)
                // If segment.speaker is "Edip" and content starts with "Dr. Khalifa:", that implies the whole segment is wrong speaker?
                // Or a merge happened immediately?
                // We will treat index > 0 as definite split.
                // index === 0 we can ignore for now based on "merged speaker" usually being in middle.
                return false;
            }
            return true;
        });

        if (splitPoints.length === 0) {
            newSegmentsBatch.push({
                ...segment,
                segment_index: nextIndex++
            });
            continue;
        }

        changesCount++;
        // Log only significant changes to avoid spam
        console.log(`Splitting in ${mediaId} index ${segment.segment_index}`);
        console.log(`Matched content: ${content}`);

        let currentStartTime = segment.start_time;
        const totalDuration = segment.end_time - segment.start_time;
        const totalLength = content.length;

        const parts: { speaker: string, text: string }[] = [];

        parts.push({
            speaker: segment.speaker,
            text: content.substring(0, splitPoints[0].index).trim()
        });

        for (let i = 0; i < splitPoints.length; i++) {
            const m = splitPoints[i];
            const start = m.index;
            const end = (i < splitPoints.length - 1) ? splitPoints[i + 1].index : content.length;
            const newSpeaker = m[1].trim();
            const text = content.substring(start + m[0].length, end).trim();
            parts.push({ speaker: newSpeaker, text: text });
        }

        for (const part of parts) {
            const partRatio = part.text.length / totalLength;
            const partDuration = totalDuration * partRatio;
            const partEndTime = currentStartTime + partDuration;

            if (part === parts[0]) {
                newSegmentsBatch.push({
                    ...segment,
                    content: part.text,
                    speaker: part.speaker,
                    start_time: currentStartTime,
                    end_time: partEndTime,
                    segment_index: nextIndex++
                });
            } else {
                newSegmentsBatch.push({
                    media_id: segment.media_id,
                    content: part.text,
                    speaker: part.speaker,
                    start_time: currentStartTime,
                    end_time: partEndTime,
                    segment_index: nextIndex++
                });
            }
            currentStartTime = partEndTime;
        }
    }

    if (changesCount === 0) {
        // optional: skip upsert if no changes at all?
        // But we re-indexed everything. Ideally we check if indices changed.
        // If no content splits, indices only change if we deleted something before?
        // Or if we just want to ensure consistency.
        // Optimization: if newSegmentsBatch is identical to original, skip.
        // Checking identity is expensive.
        // Just skip if `changesCount === 0`.
        return;
    }

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would update ${mediaId}: ${changesCount} splits.`);
        return;
    }

    const cleanPayload = newSegmentsBatch.map(({ search_vector, ...rest }) => rest);
    const updates = cleanPayload.filter(s => s.id);
    const inserts = cleanPayload.filter(s => !s.id);

    if (updates.length > 0) {
        const { error: updateError } = await supabase.from('transcript_segments').upsert(updates);
        if (updateError) console.error(`Error updating ${mediaId}:`, updateError);
    }
    if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('transcript_segments').insert(inserts);
        if (insertError) console.error(`Error inserting ${mediaId}:`, insertError);
    }

    console.log(`Updated ${mediaId}: ${updates.length} updates, ${inserts.length} inserts.`);
}



main();
