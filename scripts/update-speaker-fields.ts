/**
 * Update all Messenger Audio transcripts to have blank speaker fields
 * Since YouTube auto-generated transcripts don't have speaker diarization
 */

import fs from 'fs/promises';
import path from 'path';

interface TranscriptSegment {
    id: number;
    speaker: string;
    start_time: number;
    end_time: number;
    content: string;
}

async function updateSpeakerFields() {
    const transcriptsDir = path.join(__dirname, '../messenger_audio_transcripts');

    console.log('Updating speaker fields to blank...\n');

    const files = await fs.readdir(transcriptsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('temp_'));

    console.log(`Found ${jsonFiles.length} transcript files\n`);

    for (const file of jsonFiles) {
        const filePath = path.join(transcriptsDir, file);

        try {
            // Read transcript
            const content = await fs.readFile(filePath, 'utf-8');
            const segments: TranscriptSegment[] = JSON.parse(content);

            // Update speaker field to empty string
            const updated = segments.map(seg => ({
                ...seg,
                speaker: ''
            }));

            // Write back
            await fs.writeFile(
                filePath,
                JSON.stringify(updated, null, 2),
                'utf-8'
            );

            console.log(`✓ Updated ${file}`);
        } catch (error: any) {
            console.error(`✗ Error updating ${file}:`, error.message);
        }
    }

    console.log('\n✓ All transcripts updated!');
}

updateSpeakerFields().catch(console.error);
