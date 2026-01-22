import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { studyNumber, segments } = await request.json();

        if (!studyNumber || !segments) {
            return NextResponse.json(
                { message: 'Missing studyNumber or segments' },
                { status: 400 }
            );
        }

        // Create corrections directory if needed
        const correctionsDir = path.join(process.cwd(), 'temp_corrections');
        if (!fs.existsSync(correctionsDir)) {
            fs.mkdirSync(correctionsDir, { recursive: true });
        }

        // Save corrected transcript
        const filename = `quran_study_${studyNumber}.json`;
        const filepath = path.join(correctionsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(segments, null, 2));

        return NextResponse.json({
            success: true,
            message: `Saved ${segments.length} segments to ${filename}`
        });

    } catch (error) {
        console.error('Error saving transcript:', error);
        return NextResponse.json(
            { message: 'Failed to save transcript' },
            { status: 500 }
        );
    }
}
