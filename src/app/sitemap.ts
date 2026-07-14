import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

type MasterIndexItem = {
    id: string;
    type: string;
};

type OtherBook = {
    id: string;
};

function readJson<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

export default function sitemap(): MetadataRoute.Sitemap {
    const masterIndex = readJson<MasterIndexItem>(
        path.join(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json'),
    );
  const otherBooks = readJson<OtherBook>(
        path.join(process.cwd(), 'public', 'data', 'generated_indices', 'BOOKS_LIST.json'),
    );

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
        { url: `${SITE_URL}/videos`, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/audios`, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${SITE_URL}/quran`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${SITE_URL}/search`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/written`, changeFrequency: 'monthly', priority: 0.5 },
    ];

    const mediaRoutes: MetadataRoute.Sitemap = masterIndex
        .filter((item) => item.type === 'video-program' || item.type === 'quran-study' || item.type === 'messenger-audio')
        .map((item) => ({
            url: `${SITE_URL}/media/${item.id.split('/').map(encodeURIComponent).join('/')}`,
            changeFrequency: 'yearly',
            priority: 0.6,
        }));

    const quranRoutes: MetadataRoute.Sitemap = masterIndex
        .filter((item) => item.type === 'quran')
        .map((item) => ({
            url: `${SITE_URL}/quran/${item.id.replace(/^quran\//, '')}`,
            changeFrequency: 'yearly',
            priority: 0.7,
        }));

    const libraryRoutes: MetadataRoute.Sitemap = [
        ...masterIndex
            .filter((item) => item.type === 'perspective' || item.type === 'appendix')
            .map((item) => item.id),
        ...otherBooks.map((item) => item.id),
    ].map((id) => ({
        url: `${SITE_URL}/library/${encodeURIComponent(id)}`,
        changeFrequency: 'yearly',
        priority: 0.5,
    }));

    return [...staticRoutes, ...mediaRoutes, ...quranRoutes, ...libraryRoutes];
}
