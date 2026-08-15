import type { Metadata } from 'next';
import ScriptureTabs from '@/components/layout/ScriptureTabs';

export const metadata: Metadata = {
    title: 'NT Apocrypha',
    description: 'The New Testament Apocrypha — early Christian writings outside the canonical New Testament.',
};

export default function NTApocryphaPage() {
    return (
        <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/20">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-ed-rule">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-ambient-1 blur-[120px]" />
                    <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-ed-ambient-2 blur-[100px]" />
                </div>

                <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-fg-muted">
                        Scripture
                    </p>
                    <h1 className="mt-6 font-serif text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ed-fg">
                        NT Apocrypha
                    </h1>
                    <p className="mt-6 max-w-[50ch] font-serif text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
                        Early Christian writings and apocryphal texts outside the canonical New Testament.
                    </p>

                    <ScriptureTabs />
                </div>
            </div>

            {/* Coming Soon */}
            <main className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                    <div className="rounded-2xl border border-ed-rule bg-ed-surface/60 px-10 py-12 backdrop-blur-xl">
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ed-fg-muted">
                            Coming Soon
                        </p>
                        <h2 className="mt-4 font-serif text-xl sm:text-2xl font-bold leading-[1.2] tracking-[-0.018em] text-ed-fg">
                            NT Apocrypha texts are being prepared
                        </h2>
                        <p className="mt-3 max-w-[44ch] text-sm leading-[1.6] text-ed-fg-muted">
                            Source material for the New Testament Apocrypha will be added here. Check back soon.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
