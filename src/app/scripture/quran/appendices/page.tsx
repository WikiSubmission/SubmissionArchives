import type { Metadata } from 'next';
import { getAppendixCatalog } from '@/lib/appendixCatalog';
import AppendicesPageClient from '@/app/quran/appendices/AppendicesPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Appendices',
    description: '38 explanatory works and mathematical research notes from the translated editions.',
};

export default function AppendicesPage() {
    const appendices = getAppendixCatalog();
    return <AppendicesPageClient appendices={appendices} />;
}
