import { fetchQuranStudyData } from '@/lib/studyActions';
import * as fs from 'fs';
import * as path from 'path';
import ReviewClient from './ReviewClient';

async function getStudyList(): Promise<{ studyNumber: number; filename: string }[]> {
    const vttDir = path.join(process.cwd(), 'temp_vtt');

    if (!fs.existsSync(vttDir)) {
        return [];
    }

    const files = fs.readdirSync(vttDir)
        .filter(f => f.endsWith('.vtt'))
        .map(f => ({
            studyNumber: parseInt(f.match(/^(\d+)/)?.[1] || '0'),
            filename: f
        }))
        .sort((a, b) => a.studyNumber - b.studyNumber);

    return files;
}

export default async function ReviewTranscriptsPage({
    searchParams
}: {
    searchParams: Promise<{ study?: string }>
}) {
    const params = await searchParams;
    const studyNumber = params.study ? parseInt(params.study) : 1;

    const studyList = await getStudyList();
    const studyData = await fetchQuranStudyData(studyNumber);

    if (studyList.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No VTT Files Found</h1>
                    <p className="text-muted-foreground">
                        Run the VTT extraction script first to populate temp_vtt/
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ReviewClient
            studyList={studyList}
            initialStudyData={studyData}
            currentStudyNumber={studyNumber}
        />
    );
}



