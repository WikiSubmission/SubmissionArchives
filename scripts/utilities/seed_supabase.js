
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIG ---
const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error("Please set SUPABASE_KEY environment variable.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map local folders to DB 'type'
const FOLDERS = {
    'Messenger Quran Studies/transcripts': 'quran-study',
    'Messenger Sermons/transcripts': 'sermon',
    'messenger_audios/transcripts': 'audio',
    'Video Programs/transcripts': 'video-program'
};

const BASE_DIR = String.raw`c:\Users\Jonathan\Desktop\RKM`;

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function parseFilename(filename) {
    // Basic heuristics to extract title and date?
    // For now, just use basename as title
    return path.basename(filename, '.json').replace('_diarized', '');
}

async function processFile(filePath, type) {
    console.log(`Processing ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error(`  [Error] Invalid JSON: ${filePath}`);
        return;
    }

    if (!data.segments || data.segments.length === 0) {
        console.warn(`  [Skip] No segments found.`);
        return;
    }

    const title = parseFilename(filePath);
    const slug = slugify(title);

    // 1. Insert Media
    // We use upsert on slug to avoid duplicates
    const { data: mediaRecord, error: mediaError } = await supabase
        .from('media')
        .upsert({
            title: title,
            slug: slug,
            type: type,
            local_filename: path.basename(filePath),
            duration_seconds: Math.ceil(data.segments[data.segments.length - 1].end)
        }, { onConflict: 'slug' })
        .select()
        .single();

    if (mediaError) {
        console.error(`  [Error] DB Insert (Media): ${mediaError.message}`);
        return;
    }

    // 2. Prepare Segments
    const segmentsToAdd = data.segments.map((seg, index) => ({
        media_id: mediaRecord.id,
        segment_index: index,
        start_time: seg.start,
        end_time: seg.end,
        content: seg.text,
        speaker: seg.speaker || 'Unknown'
    }));

    // 3. Delete existing segments (if re-running) to enable clean slate
    const { error: deleteError } = await supabase
        .from('transcript_segments')
        .delete()
        .eq('media_id', mediaRecord.id);

    if (deleteError) console.error("Deletion error:", deleteError);

    // 4. Bulk Insert Segments (in chunks of 1000 to be safe)
    // Supabase usually handles large inserts well, but let's be safe.
    const CHUNK_SIZE = 500;
    for (let i = 0; i < segmentsToAdd.length; i += CHUNK_SIZE) {
        const chunk = segmentsToAdd.slice(i, i + CHUNK_SIZE);
        const { error: segError } = await supabase
            .from('transcript_segments')
            .insert(chunk);

        if (segError) {
            console.error(`  [Error] DB Insert (Segments batch ${i}): ${segError.message}`);
        }
    }

    console.log(`  [Success] Inserted ${segmentsToAdd.length} segments for "${title}"`);
}

async function main() {
    for (const [folder, type] of Object.entries(FOLDERS)) {
        const dirPath = path.join(BASE_DIR, folder);
        if (!fs.existsSync(dirPath)) {
            console.warn(`Directory not found: ${dirPath}`);
            continue;
        }

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        console.log(`\n--- Processing ${files.length} ${type}s from ${folder} ---`);

        for (const file of files) {
            await processFile(path.join(dirPath, file), type);
        }
    }
}

main();
