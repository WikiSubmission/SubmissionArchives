import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { getAppendixCatalog } from '@/lib/appendixCatalog';
import AppendicesGrid from '@/app/quran/appendices/AppendicesGrid';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Appendices',
    description: 'Reference material and structured explanatory works from the translated editions.',
};

export default function AppendicesPage() {
    const appendices = getAppendixCatalog();

    return (
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg">
            <main id="main-content" className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div className="space-y-6">
                        <Link href="/scripture/quran" className="inline-flex items-center gap-2 text-sm text-ed-fg-muted hover:text-ed-accent transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Qur&apos;an
                        </Link>
                        <h1 className="max-w-[12ch] font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-ed-fg">
                            Appendices
                        </h1>
                    </div>
                    <div className="space-y-5 lg:pb-1">
                        <p className="max-w-[58ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                            Compare and read the explanatory appendices detailing the miraculous mathematical structure and divine preservation of the Qur&apos;an.
                        </p>
                    </div>
                </header>

                <AppendicesGrid appendices={appendices} />
            </main>
        </div>
    );
}
