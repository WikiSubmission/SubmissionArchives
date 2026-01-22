/**
 * Comprehensive Speaker Pattern Analyzer
 * 
 * Scans all VTT files to identify every unique speaker pattern,
 * showing which studies they appear in and with example text.
 */

import * as fs from 'fs';
import * as path from 'path';

interface SpeakerOccurrence {
    study: number;
    timestamp: string;
    fullLine: string;
    extractedSpeaker: string;
}

/**
 * Find all potential speaker patterns in VTT content
 * Looking for patterns like "Name:" at the start of cue text
 */
function findSpeakerPatterns(vttContent: string, studyNumber: number): SpeakerOccurrence[] {
    const occurrences: SpeakerOccurrence[] = [];
    const normalized = vttContent.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');

    // More permissive pattern - look for any word(s) followed by colon at start of line
    // This will catch: "Name:", "Dr. Name:", "A man:", "The woman:", etc.
    const speakerPattern = /^([A-Za-z][A-Za-z\s\.]*?):\s*/;

    let currentTimestamp = '';

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        // Skip headers
        if (lines[0].startsWith('WEBVTT')) continue;
        if (lines[0].startsWith('NOTE')) continue;
        if (lines[0].startsWith('Kind:')) continue;
        if (lines[0].startsWith('Language:')) continue;

        // Find timestamp
        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) continue;

        currentTimestamp = lines[timeLineIdx].split('-->')[0].trim();

        // Content is lines after timestamp
        const contentLines = lines.slice(timeLineIdx + 1);
        const fullContent = contentLines.join(' ');

        // Check if this cue starts with a speaker pattern
        const match = fullContent.match(speakerPattern);
        if (match) {
            const speaker = match[1].trim();

            // Filter out obvious non-speakers (verse references, common words)
            if (speaker.match(/^\d/) || speaker.match(/^\[/)) continue;
            if (speaker.toLowerCase() === 'say' || speaker.toLowerCase() === 'said') continue;
            if (speaker.match(/^verse/i)) continue;

            occurrences.push({
                study: studyNumber,
                timestamp: currentTimestamp,
                fullLine: fullContent.substring(0, 100) + (fullContent.length > 100 ? '...' : ''),
                extractedSpeaker: speaker
            });
        }
    }

    return occurrences;
}

function getStudyNumber(filename: string): number {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

async function main() {
    const inputDir = path.join(process.cwd(), 'temp_vtt');

    const vttFiles = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.vtt'))
        .sort((a, b) => getStudyNumber(a) - getStudyNumber(b));

    console.log(`Analyzing ${vttFiles.length} VTT files for speaker patterns...\n`);

    // Collect all speaker occurrences
    const allOccurrences: SpeakerOccurrence[] = [];
    const speakersByStudy = new Map<number, Set<string>>();

    for (const vttFile of vttFiles) {
        const vttPath = path.join(inputDir, vttFile);
        const studyNumber = getStudyNumber(vttFile);
        const content = fs.readFileSync(vttPath, 'utf-8');

        const occurrences = findSpeakerPatterns(content, studyNumber);
        allOccurrences.push(...occurrences);

        // Track speakers per study
        const studySpeakers = new Set<string>();
        occurrences.forEach(o => studySpeakers.add(o.extractedSpeaker));
        speakersByStudy.set(studyNumber, studySpeakers);
    }

    // Group by unique speaker name
    const speakerGroups = new Map<string, SpeakerOccurrence[]>();
    for (const occ of allOccurrences) {
        const key = occ.extractedSpeaker.toLowerCase();
        if (!speakerGroups.has(key)) {
            speakerGroups.set(key, []);
        }
        speakerGroups.get(key)!.push(occ);
    }

    // Sort by frequency
    const sortedSpeakers = [...speakerGroups.entries()].sort((a, b) => b[1].length - a[1].length);

    console.log('='.repeat(80));
    console.log('ALL UNIQUE SPEAKER PATTERNS FOUND (sorted by frequency)');
    console.log('='.repeat(80));
    console.log();

    for (const [speaker, occurrences] of sortedSpeakers) {
        const studies = [...new Set(occurrences.map(o => o.study))].sort((a, b) => a - b);
        const displayName = occurrences[0].extractedSpeaker; // Use original casing

        console.log(`"${displayName}" - ${occurrences.length} occurrences in ${studies.length} studies`);
        console.log(`  Studies: ${studies.join(', ')}`);
        console.log(`  Example: ${occurrences[0].fullLine}`);
        console.log();
    }

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total unique speakers found: ${speakerGroups.size}`);
    console.log(`Total speaker occurrences: ${allOccurrences.length}`);
    console.log();

    // Output as JSON for easy reference
    const report = {
        totalSpeakers: speakerGroups.size,
        totalOccurrences: allOccurrences.length,
        speakers: sortedSpeakers.map(([key, occs]) => ({
            name: occs[0].extractedSpeaker,
            count: occs.length,
            studies: [...new Set(occs.map(o => o.study))].sort((a, b) => a - b),
            example: occs[0].fullLine
        }))
    };

    fs.writeFileSync('speaker_analysis.json', JSON.stringify(report, null, 2));
    console.log('Full report saved to speaker_analysis.json');
}

main().catch(console.error);
