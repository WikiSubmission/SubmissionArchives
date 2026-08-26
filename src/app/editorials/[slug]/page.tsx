import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';

import EditorialAside from '@/components/editorials/EditorialAside';
import EditorialHeader from '@/components/editorials/EditorialHeader';
import EditorialReader from '@/components/editorials/EditorialReader';
import EditorialToc from '@/components/editorials/EditorialToc';
import { getEditorial, getEditorialNeighbours, getEditorialSlugs } from '@/lib/editorials';

import '../editorials.css';

export const dynamicParams = false;

export function generateStaticParams() {
    return getEditorialSlugs().map((slug) => ({ slug }));
}

interface EditorialPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditorialPageProps): Promise<Metadata> {
    const { slug } = await params;
    const editorial = getEditorial(slug);

    if (!editorial) {
        return { title: 'Editorial not found — Submission Archives' };
    }

    return {
        title: `${editorial.title} — Archive Editorials`,
        description: editorial.summary,
        openGraph: {
            type: 'article',
            title: editorial.title,
            description: editorial.summary,
            publishedTime: editorial.publishedAt,
            modifiedTime: editorial.updatedAt,
            authors: [editorial.author],
            images: editorial.hero ? [{ url: editorial.hero.src }] : undefined,
        },
    };
}

export default async function EditorialPage({ params }: EditorialPageProps) {
    const { slug } = await params;
    const editorial = getEditorial(slug);

    if (!editorial) {
        notFound();
    }

    const neighbours = getEditorialNeighbours(slug);
    // The slug is constrained by generateStaticParams plus dynamicParams:false,
    // so the template import can only resolve to a known editorial.
    const { default: EditorialBody } = await import(`@/content/editorials/${slug}/index.mdx`);

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            <main id="main-content" className="mx-auto max-w-[1560px] px-4 py-8 sm:px-7 lg:py-12">
                <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,13rem)]">
                    {/* Sidebar: sections of this editorial */}
                    <aside className="mb-10 lg:sticky lg:top-[84px] lg:mb-0 lg:max-h-[calc(100dvh-108px)] lg:self-start lg:overflow-y-auto lg:pb-6">
                        <Link
                            href="/written#archive-editorials"
                            className="mb-6 inline-flex items-center gap-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-muted transition-colors hover:text-ed-accent"
                        >
                            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                            Archive Editorials
                        </Link>
                        <EditorialToc headings={editorial.headings} />
                    </aside>

                    {/* The reading sheet */}
                    <div className="min-w-0">
                        <div className="mx-auto max-w-[64rem] rounded-[4px] border border-ed-rule bg-ed-surface-raised px-5 py-8 sm:px-10 sm:py-12">
                            <EditorialReader header={<EditorialHeader editorial={editorial} />}>
                                <EditorialBody />
                            </EditorialReader>
                        </div>
                    </div>

                    {/* Provenance and neighbours */}
                    <aside className="mt-10 lg:col-span-2 xl:sticky xl:top-[84px] xl:col-span-1 xl:mt-0 xl:self-start">
                        <EditorialAside editorial={editorial} neighbours={neighbours} />
                    </aside>
                </div>
            </main>
        </div>
    );
}
