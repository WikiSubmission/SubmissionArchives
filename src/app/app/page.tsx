import type { Metadata } from 'next';
import AppDownloadClient from './AppDownloadClient';

export const metadata: Metadata = {
    title: 'SA Studio Desktop Workspace — Submission Archives',
    description:
        'SubmissionArchives Studio — a high-performance, local-first desktop workspace built with native Rust and Tauri for offline research, exegesis, and knowledge synthesis.',
};

export default function AppPage() {
    return <AppDownloadClient />;
}