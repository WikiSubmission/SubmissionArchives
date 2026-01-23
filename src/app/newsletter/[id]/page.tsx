import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import NewsletterClient from './NewsletterClient';
import { notFound } from 'next/navigation';
import { getAdjacentNewsletters } from '@/lib/newsletterUtils';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public', 'data', 'newsletters', 'html', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        return { title: 'Newsletter Not Found' };
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return {
            title: `${data.document.header.title} (${data.document.header.date}) | Submission Archives`,
            description: data.document.header.subtitle
        };
    } catch (e) {
        return { title: 'Error Loading Newsletter' };
    }
}

export default async function NewsletterPage({ params }: Props) {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public', 'data', 'newsletters', 'html', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        notFound();
    }

    let data;
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error("Error parsing newsletter JSON:", error);
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-mono">
                Error loading document. JSON format may be invalid.
            </div>
        );
    }

    const { prevId, nextId } = getAdjacentNewsletters(id);

    return <NewsletterClient data={data} id={id} prevId={prevId} nextId={nextId} />;
}
