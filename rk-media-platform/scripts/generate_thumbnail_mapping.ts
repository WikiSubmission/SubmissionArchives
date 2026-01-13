import fs from 'fs';
import path from 'path';

const FRIDAY_SERMONS = path.join(process.cwd(), 'public/data/generated_indices/ALL_FRIDAY_SERMONS.json');
const ALL_SERMONS = path.join(process.cwd(), 'public/data/generated_indices/ALL_SERMONS.json');
const VIDEO_PROGRAMS = path.join(process.cwd(), 'public/data/generated_indices/ALL_VIDEO_PROGRAMS.json');
const OUTPUT = path.join(process.cwd(), 'src/data/thumbnail_mapping.json');

interface Media {
    id: string;
    title: string;
}

function cleanFilename(filename: string): string {
    return filename
        .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w\-_.]/g, '')
        .replace(/\.mp4$/, '');
}

async function createMapping() {
    const mapping: Record<string, string> = {};

    // Load all JSON files
    const fridaySermons: Media[] = JSON.parse(fs.readFileSync(FRIDAY_SERMONS, 'utf-8'));
    const allSermons: Media[] = JSON.parse(fs.readFileSync(ALL_SERMONS, 'utf-8'));
    const videoPrograms: Media[] = JSON.parse(fs.readFileSync(VIDEO_PROGRAMS, 'utf-8'));

    console.log('Creating thumbnail mapping...\n');

    // Map Friday Sermons to ALL_SERMONS (which has YouTube IDs)
    for (const fridaySermon of fridaySermons) {
        // Extract key words from Friday sermon title
        const fridayWords = fridaySermon.title
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3); // Only words longer than 3 chars

        // Find best matching sermon in ALL_SERMONS
        let bestMatch: Media | null = null;
        let bestScore = 0;

        for (const sermon of allSermons) {
            const sermonWords = sermon.title
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3);

            // Count matching words
            const matchingWords = fridayWords.filter(w => sermonWords.includes(w));
            const score = matchingWords.length;

            if (score > bestScore && score >= 2) { // At least 2 matching words
                bestScore = score;
                bestMatch = sermon;
            }
        }

        if (bestMatch) {
            const r2Key = fridaySermon.id;
            const thumbnailFilename = cleanFilename(bestMatch.id);
            mapping[r2Key] = thumbnailFilename;
            console.log(`✓ Mapped (score: ${bestScore}): ${fridaySermon.title}`);
            console.log(`  → ${bestMatch.title}`);
            console.log(`  Thumbnail: ${thumbnailFilename}.jpg\n`);
        } else {
            console.log(`✗ No match found for: ${fridaySermon.title}\n`);
        }
    }

    // Video programs - just use the clean filename
    for (const program of videoPrograms) {
        const r2Key = program.id;
        const thumbnailFilename = cleanFilename(program.id);
        mapping[r2Key] = thumbnailFilename;
    }

    // Write mapping to file
    fs.writeFileSync(OUTPUT, JSON.stringify(mapping, null, 2));
    console.log(`\n✓ Mapping file created: ${OUTPUT}`);
    console.log(`Total mappings: ${Object.keys(mapping).length}`);
}

createMapping().catch(console.error);
