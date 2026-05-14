import { listMediaFiles } from '@/lib/r2Bucket';
import HomePageClient from './HomePageClient';
import path from 'path';
import fs from 'fs';

export const revalidate = 0; // Disable cache to debug R2 listing

export default async function Home() {
    // Fetch media from R2 Bucket directly
    const media = await listMediaFiles();


    // Load durations if available
    const durationsPath = path.join(process.cwd(), 'src', 'data', 'mediaDurations.json');
    let durationMap: Record<string, number> = {};

    if (fs.existsSync(durationsPath)) {
        try {
            durationMap = JSON.parse(fs.readFileSync(durationsPath, 'utf-8'));
        } catch {
            console.error("Failed to load media durations map");
        }
    }

    // Inject durations
    const enrichedMedia = (media || []).map(item => ({
        ...item,
        duration_seconds: durationMap[item.id] || 0
    }));

    // Pass data to Client Component
    return <HomePageClient initialMedia={enrichedMedia} />;
}
