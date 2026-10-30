import type { Metadata } from 'next';
import MediaArchiveClient from './MediaArchiveClient';
import { getRecordings } from '@/lib/recordingCatalog';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Recordings',
    description:
        'Video programs, Friday sermons, lessons, debates, Quran studies and messenger audio by Dr. Rashad Khalifa, each with a searchable transcript.',
};

export default function MediaPage() {
    return <MediaArchiveClient recordings={getRecordings()} />;
}
