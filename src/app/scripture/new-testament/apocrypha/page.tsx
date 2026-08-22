import type { Metadata } from 'next';
import Link from 'next/link';
import ScriptureTabs from '@/components/layout/ScriptureTabs';

export const metadata: Metadata = {
    title: 'NT Apocrypha',
    description: 'The New Testament Apocrypha — early Christian writings outside the canonical New Testament.',
};

export default function NTApocryphaPage() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-7 lg:py-12">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-ed-fg-muted">
                        <Link href="/" className="text-ed-fg-muted transition-colors hover:text-ed-accent">
                            Submission Archives
                        </Link>
                        <span className="text-ed-fg-faint">/</span>
                        <span className="text-ed-fg-secondary">NT Apocrypha</span>
                    </nav>

                    {/* Hero Header */}
                    <header className="mb-7 border-b border-ed-rule pb-7">
                        <div className="max-w-[640px]">
                            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                                Scripture Collection
                            </div>
                            <h1
                                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                NT Apocrypha
                            </h1>
                            <p
                                className="text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Early Christian writings and apocryphal texts outside the canonical New Testament.
                            </p>
                        </div>

                        <ScriptureTabs />
                    </header>

                    {/* Coming Soon */}
                    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                        <div className="rounded-[12px] border border-ed-rule bg-ed-surface px-10 py-12 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ed-accent">
                                Coming Soon
                            </p>
                            <h2
                                className="mt-4 text-xl font-semibold leading-[1.2] tracking-[-0.018em] text-ed-fg sm:text-2xl"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                NT Apocrypha texts are being prepared
                            </h2>
                            <p className="mt-3 max-w-[44ch] text-sm leading-[1.6] text-ed-fg-secondary">
                                Source material for the New Testament Apocrypha will be added here. Check back soon.
                            </p>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
        </div>
    );
}
