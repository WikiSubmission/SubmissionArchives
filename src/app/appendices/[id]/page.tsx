import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import AppendixContent from './AppendixContent';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
    const dir = path.join(process.cwd(), 'public/data/appendices/json');
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    return files.map(f => ({ id: f.replace('.json', '') }));
}

export default async function AppendixPage({ params }: Props) {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public/data/appendices/json', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        notFound();
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Load metadata to determine prev/next
    const metadataPath = path.join(process.cwd(), 'public/data/appendices/metadata.json');
    let prevAppendix = null;
    let nextAppendix = null;

    if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        const currentIndex = metadata.findIndex((a: any) => a.id === id);
        if (currentIndex !== -1) {
            prevAppendix = currentIndex > 0 ? metadata[currentIndex - 1] : null;
            nextAppendix = currentIndex < metadata.length - 1 ? metadata[currentIndex + 1] : null;
        }
    }

    return <AppendixContent content={content} prevAppendix={prevAppendix} nextAppendix={nextAppendix} />;
}
