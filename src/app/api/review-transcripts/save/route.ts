import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import {
    checkRateLimit,
    getClientIp,
    jsonByteLength,
    parsePositiveInt,
    rateLimitResponse,
    requireAdminRequest,
} from '@/lib/security';

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_SEGMENTS = 5000;
const MAX_TEXT_FIELD_LENGTH = 20_000;

export async function POST(request: NextRequest) {
    const adminError = requireAdminRequest(request);
    if (adminError) return adminError;

    const rateLimit = checkRateLimit(`review-save:${getClientIp(request.headers)}`, 20);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
        return NextResponse.json({ message: 'Request body is too large' }, { status: 413 });
    }

    try {
        const { studyNumber, segments } = await request.json();
        const parsedStudyNumber = parsePositiveInt(studyNumber, 1000);
        const cleanSegments = validateSegments(segments);

        if (!parsedStudyNumber || !cleanSegments) {
            return NextResponse.json(
                { message: 'Invalid studyNumber or segments' },
                { status: 400 }
            );
        }

        if (jsonByteLength(cleanSegments) > MAX_BODY_BYTES) {
            return NextResponse.json({ message: 'Transcript payload is too large' }, { status: 413 });
        }

        // Create corrections directory if needed
        const correctionsDir = path.join(process.cwd(), 'temp_corrections');
        if (!fs.existsSync(correctionsDir)) {
            fs.mkdirSync(correctionsDir, { recursive: true });
        }

        // Save corrected transcript
        const filename = `quran_study_${parsedStudyNumber}.json`;
        const filepath = path.join(correctionsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(cleanSegments, null, 2));

        return NextResponse.json({
            success: true,
            message: `Saved ${cleanSegments.length} segments to ${filename}`
        });

    } catch (error) {
        console.error('Error saving transcript:', error);
        return NextResponse.json(
            { message: 'Failed to save transcript' },
            { status: 500 }
        );
    }
}

function validateSegments(segments: unknown) {
    if (!Array.isArray(segments) || segments.length > MAX_SEGMENTS) {
        return null;
    }

    const cleanSegments = [];

    for (const segment of segments) {
        if (!segment || typeof segment !== 'object') return null;

        const item = segment as Record<string, unknown>;
        const id = Number(item.id);
        const segmentIndex = Number(item.segment_index);
        const startTime = Number(item.start_time);
        const endTime = Number(item.end_time);
        const content = typeof item.content === 'string' ? item.content : null;
        const speaker = typeof item.speaker === 'string' ? item.speaker : null;

        if (!Number.isFinite(id) || !Number.isFinite(segmentIndex)) return null;
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;
        if (content === null || speaker === null) return null;
        if (content.length > MAX_TEXT_FIELD_LENGTH || speaker.length > 200) return null;

        cleanSegments.push({
            id,
            segment_index: segmentIndex,
            start_time: startTime,
            end_time: endTime,
            content,
            speaker,
        });
    }

    return cleanSegments;
}
