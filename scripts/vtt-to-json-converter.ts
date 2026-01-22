/**
 * VTT to JSON Converter for Quran Study Transcripts
 * 
 * Converts YouTube VTT files to the JSON segment format with proper speaker attribution.
 * Handles:
 * - Speaker continuation (if no speaker prefix, inherit from previous cue)
 * - Multi-speaker cues (splits "Dr. Khalifa: No. Catherine: Yes." into separate segments)
 * - False positive filtering (verse references, section titles, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';

interface Segment {
    id: number;
    segment_index: number;
    start_time: number;
    end_time: number;
    content: string;
    speaker: string;
}

// Known speaker prefixes for validation
const KNOWN_SPEAKER_PREFIXES = [
    'dr.', 'dr', 'a man', 'a woman', 'a child', 'a person', 'a kid',
    'the messenger', 'the footnote', 'audience', 'people'
];

/**
 * Parse VTT timestamp to seconds
 */
function parseTimestamp(timestamp: string): number {
    if (!timestamp) return 0;
    const parts = timestamp.trim().split(':');
    let seconds = 0;

    if (parts.length === 3) {
        seconds += parseInt(parts[0]) * 3600;
        seconds += parseInt(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
        seconds += parseInt(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
    }

    return seconds;
}

// CP437 characters from 0x80 to 0xFF
// This string maps index+128 to the character
const CP437_HIGH = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";


function recoverArabic(text: string): string {
    // If text contains sequences of chars that map to CP437 high bytes (0x80-0xFF)
    // We construct a regex that matches any 2+ run of these characters
    const escapedHigh = CP437_HIGH.replace(/[\]\-\^]/g, '\\$&');
    const pattern = new RegExp(`[${escapedHigh}]{2,}`, 'g');

    return text.replace(pattern, (match) => {
        // 1. Convert string to bytes based on CP437 mapping
        // We capture EVERYTHING in the match.
        const bytes: number[] = [];
        for (let i = 0; i < match.length; i++) {
            const char = match[i];
            const index = CP437_HIGH.indexOf(char);
            if (index !== -1) {
                bytes.push(index + 128);
            }
        }

        // 2. Strict Filter: Only allow valid 2-byte Arabic sequences (D8xx - DBxx)
        // Check for valid UTF-8 structure.
        // Replace invalid bytes with 0x20 (Space).
        const validBytes: number[] = [];
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];

            // Check for Continuation Byte (80-BF)
            if (b >= 0x80 && b <= 0xBF) {
                const prev = validBytes.length > 0 ? validBytes[validBytes.length - 1] : 0;
                // Check if previous byte was a valid start byte for 2-byte sequence (D8-DB for Arabic)
                // Actually 06xx range uses D8, D9, DA, DB.
                // Standard 2-byte start is C2-DF.
                if (prev >= 0xD8 && prev <= 0xDB) {
                    validBytes.push(b); // Valid continuation
                } else {
                    // Orphan continuation or following non-start -> Replace with Space
                    // This handles A0 and other artifacts
                    validBytes.push(0x20);
                }
                continue;
            }

            // Start Bytes (D8-DB) -> Push
            if (b >= 0xD8 && b <= 0xDB) {
                validBytes.push(b);
                continue;
            }

            // Any other High Byte (C0-D7, DC-FF) is invalid in Arabic 06xx block context
            // Replace with Space
            validBytes.push(0x20);
        }

        // 3. Decode bytes as UTF-8
        try {
            const buffer = new Uint8Array(validBytes);
            const decoded = new TextDecoder('utf-8').decode(buffer);

            // 4. Check if we actually recovered Arabic
            if (/[\u0600-\u06FF]/.test(decoded)) {
                return decoded;
            }
        } catch (e) {
            // Decoding failed
        }

        return match; // Fallback to original if recovery failed
    });
}

/**
 * Clean up VTT text content
 */
function cleanText(text: string): string {
    let cleaned = text
        // HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        // Mojibake fixes for Latin text (UTF-8 interpreted as Windows-1252)
        .replace(/├ú/g, 'ā')           // ā (a with macron)
        .replace(/├®/g, 'ī')           // ī (i with macron)
        .replace(/├╗/g, 'ū')           // ū (u with macron)
        .replace(/ΓÇÿ/g, "'")          // ' (right single quote)
        .replace(/ΓÇÖ/g, "'")          // ' (right single quote variant)
        .replace(/ΓÇô/g, "–")          // – (en-dash)
        .replace(/ΓÇö/g, "—")          // — (em-dash)
        .replace(/ΓÇ£/g, '"')          // " (left double quote)
        .replace(/ΓÇ¥/g, '"')          // " (right double quote)
        .replace(/├®/g, "é")           // é 
        .replace(/├¿/g, "è")           // è
        .replace(/├í/g, "á")           // á
        .replace(/├│/g, "ó")           // ó
        // Remove VTT tags
        .replace(/<[^>]*>/g, '');

    // Attempt to recover garbled Arabic text
    cleaned = recoverArabic(cleaned);

    // If any purely box-drawing sequences remain that weren't arabic, remove them or keep them?
    // Remove sequences that look like just corrupted data but didn't decode to Arabic
    // cleaned = cleaned.replace(/[┘╪█░▓▒│┤╡╢╖╕╣║╗╝╜╛┐└┴├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┬▄▌▐▀]{3,}/g, '');

    return cleaned.trim();
}

/**
 * Check if a detected name is a valid speaker
 */
function isValidSpeaker(name: string): boolean {
    const lower = name.toLowerCase();

    // Filter out false positives
    if (lower.match(/^\d/)) return false;
    if (lower.match(/^\[/)) return false;
    if (lower === 'say' || lower === 'said' || lower === 'says') return false;
    if (lower.match(/^verse/i)) return false;
    if (lower.match(/^ok\./i)) return false;
    if (lower.match(/^chapter/i)) return false;
    if (lower.match(/^sura/i)) return false;
    if (lower.match(/^iron$/i)) return false;
    if (lower.match(/^unity$/i)) return false;
    if (lower.match(/^believers$/i)) return false;
    if (lower.match(/^idol worship$/i)) return false;
    if (lower.match(/^following/i)) return false;
    if (lower.match(/^materials/i)) return false;
    if (lower.includes('order')) return false;
    if (lower.includes('miracle')) return false;
    if (lower.includes('title')) return false;
    if (lower.includes('quran')) return false;
    if (lower.length > 50) return false; // Too long to be a name

    // Check if it's a known speaker pattern
    const isKnown = KNOWN_SPEAKER_PREFIXES.some(p => lower.startsWith(p));
    // Or it's an anonymous speaker pattern
    const isAnonymous = /^a\s+(man|woman|child|person|kid)$/i.test(name);
    // Or it's a proper noun (capitalized name)
    const isProperNoun = /^[A-Z][a-z]+$/.test(name) || /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(name);
    // Or it's "Dr. Something"
    const isDrTitle = /^Dr\.?\s+/i.test(name);

    return isKnown || isAnonymous || isProperNoun || isDrTitle;
}

/**
 * Normalize speaker names (fix misspellings, variations)
 */
function normalizeSpeaker(name: string): string {
    const lower = name.toLowerCase();

    // Dr. Khalifa variations
    if (lower.includes('khalifa') || lower.includes('khlaifa') || lower.includes('khalfia') || lower === 'rashad') {
        return 'Dr. Khalifa';
    }
    // Catherine variations
    if (lower === 'kathryn' || lower === 'cathy' || lower === 'kathy') {
        return 'Catherine';
    }
    // Ismail Barakat variations
    if (lower.includes('ismail') || lower.includes('isamil') || lower.includes('ismali') || lower.includes('isamail')) {
        if (lower.includes('barakat') || lower.includes('barakt')) {
            return 'Ismail Barakat';
        }
    }
    // Mahmood Abib variations
    if (lower.includes('mahmood') && lower.includes('abib')) {
        return 'Mahmood Abib';
    }
    // Parivash variations
    if (lower.includes('parivash') || lower.includes('parviash') || lower.includes('praivash')) {
        return 'Parivash';
    }
    // Muhtesem variations
    if (lower.includes('muhtesem') || lower.includes('muhteshem')) {
        return 'Muhtesem';
    }
    // Dr. Sabahi variations
    if (lower.includes('sabahi') || lower.includes('sabahai')) {
        return 'Dr. Sabahi';
    }
    // Laurie/Lori
    if (lower === 'laurie' || lower === 'lauri') {
        return 'Lori';
    }
    // Leila/Laila
    if (lower === 'laila') {
        return 'Leila';
    }

    // The Messenger
    if (lower === 'the messenger') {
        return 'Dr. Khalifa';
    }

    return name;
}

/**
 * Process VTT content and return segments with multi-speaker splitting
 */
function processVttContent(vttContent: string): Segment[] {
    const segments: Segment[] = [];
    const normalized = vttContent.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');

    // Specific patterns for anonymous speakers - match these first
    const anonymousSpeakerPattern = /(?:^|\s)(A\s+(?:man|woman|child|person|kid)):\s*/gi;

    // Pattern for named speakers: "Name:", "Dr. Name:", "The messenger:", etc.
    const namedSpeakerPattern = /(?:^|\s)((?:Dr\.?\s+)?(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):\s*/g;

    // Combined pattern - check for both
    const allSpeakerPattern = /(?:^|\s)((?:[Aa]\s+woman\s+and\s+a\s+group\s+of\s+children)|(?:[Tt]he\s+messenger)|(?:[Aa]\s+(?:man|woman|child|person|kid))|(?:(?:[Dd]r\.?\s+)?(?:[Tt]he\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)):\s*/g;

    let currentSpeaker = 'Dr. Khalifa';
    let segmentId = 0;

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;
        if (lines[0].startsWith('WEBVTT')) continue;
        if (lines[0].startsWith('NOTE')) continue;
        if (lines[0].startsWith('Kind:')) continue;
        if (lines[0].startsWith('Language:')) continue;

        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) continue;

        const timeLine = lines[timeLineIdx];
        const [startStr, endStrPart] = timeLine.split('-->').map(s => s.trim());
        const endStr = endStrPart ? endStrPart.split(' ')[0] : startStr;

        const startTime = parseTimestamp(startStr);
        const endTime = parseTimestamp(endStr);
        const totalDuration = endTime - startTime;

        let content = lines.slice(timeLineIdx + 1).join(' ');
        content = cleanText(content);

        if (!content) continue;

        // Find all speaker mentions in this cue
        const matches = [...content.matchAll(allSpeakerPattern)];
        const validMatches = matches.filter(m => isValidSpeaker(m[1].trim()));

        if (validMatches.length === 0) {
            // No speaker label - use current speaker (continuation)
            segments.push({
                id: segmentId++,
                segment_index: segmentId - 1,
                start_time: startTime,
                end_time: endTime,
                content: content,
                speaker: currentSpeaker
            });
        } else {
            // Split by speakers
            const subSegments: { speaker: string; content: string }[] = [];

            // Check if there's text before the first speaker
            const firstMatchStart = validMatches[0].index!;
            if (firstMatchStart > 0) {
                const preText = content.substring(0, firstMatchStart).trim();
                if (preText) {
                    subSegments.push({ speaker: currentSpeaker, content: preText });
                }
            }

            // Process each speaker mention
            for (let i = 0; i < validMatches.length; i++) {
                const match = validMatches[i];
                const speakerName = normalizeSpeaker(match[1].trim());
                const contentStart = match.index! + match[0].length;
                const contentEnd = (i < validMatches.length - 1)
                    ? validMatches[i + 1].index!
                    : content.length;

                const speechText = content.substring(contentStart, contentEnd).trim();
                if (speechText) {
                    subSegments.push({ speaker: speakerName, content: speechText });
                }
            }

            // Create segments with proportional timing
            const totalLength = subSegments.reduce((acc, s) => acc + s.content.length, 0) || 1;
            let currentTimeCursor = startTime;

            for (const sub of subSegments) {
                const ratio = sub.content.length / totalLength;
                const subDuration = totalDuration * ratio;

                currentSpeaker = sub.speaker;

                segments.push({
                    id: segmentId++,
                    segment_index: segmentId - 1,
                    start_time: currentTimeCursor,
                    end_time: currentTimeCursor + subDuration,
                    content: sub.content,
                    speaker: currentSpeaker
                });

                currentTimeCursor += subDuration;
            }
        }
    }

    return segments;
}

/**
 * Get study number from filename
 */
function getStudyNumber(filename: string): number {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

/**
 * Main function
 */
async function main() {
    const inputDir = path.join(process.cwd(), 'temp_vtt');
    const outputDir = path.join(process.cwd(), 'temp_json');

    if (!fs.existsSync(inputDir)) {
        console.error('temp_vtt directory not found. Run VTT extraction first.');
        process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get all VTT files
    const vttFiles = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.vtt'))
        .sort((a, b) => getStudyNumber(a) - getStudyNumber(b));

    console.log(`Found ${vttFiles.length} VTT files to process\n`);

    const results: { file: string; segments: number; speakers: Set<string> }[] = [];

    for (const vttFile of vttFiles) {
        const vttPath = path.join(inputDir, vttFile);
        const studyNum = getStudyNumber(vttFile);
        const outputFilename = `quran_study_${studyNum}.json`;
        const outputPath = path.join(outputDir, outputFilename);

        try {
            const vttContent = fs.readFileSync(vttPath, 'utf-8');
            const segments = processVttContent(vttContent);

            // Write JSON output
            fs.writeFileSync(outputPath, JSON.stringify(segments, null, 2));

            // Track speakers found
            const speakers = new Set(segments.map(s => s.speaker));

            results.push({
                file: outputFilename,
                segments: segments.length,
                speakers
            });

            console.log(`✓ ${vttFile} → ${outputFilename} (${segments.length} segments, speakers: ${[...speakers].join(', ')})`);
        } catch (err) {
            console.error(`✗ Error processing ${vttFile}:`, err);
        }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Processed: ${results.length} files`);
    console.log(`Total segments: ${results.reduce((sum, r) => sum + r.segments, 0)}`);

    const allSpeakers = new Set<string>();
    results.forEach(r => r.speakers.forEach(s => allSpeakers.add(s)));
    console.log(`Unique speakers: ${[...allSpeakers].join(', ')}`);

    console.log(`\nOutput written to: ${outputDir}`);
}

main().catch(console.error);
