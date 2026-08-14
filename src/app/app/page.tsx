import type { Metadata } from 'next';
import AppDownloadClient from './AppDownloadClient';

export const metadata: Metadata = {
    title: 'App',
    description: 'SubmissionArchives Studio — a local-first desktop app for exploring and editing the archive.',
};

export default function AppPage() {
    return <AppDownloadClient />;
}
