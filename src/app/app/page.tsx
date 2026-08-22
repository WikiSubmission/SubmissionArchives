import type { Metadata } from 'next';
import AppDownloadClient from './AppDownloadClient';

export const metadata: Metadata = {
    title: 'Submission Archives — Local Scholarly Workspace',
    description:
        'Submission Archives Studio — a local-first scholarly workspace for studying and expanding the archive. Private, searchable, and offline-ready.',
};

export default function AppPage() {
    return <AppDownloadClient />;
}