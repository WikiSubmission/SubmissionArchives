import type { Metadata } from 'next';
import ScriptureTabs from '@/components/layout/ScriptureTabs';

export const metadata: Metadata = {
    title: 'OT Apocrypha',
    description: 'The Old Testament Apocrypha — deuterocanonical books not included in the Hebrew canon.',
};

export default function OTApocryphaPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#f5f5f7] selection:bg-white/20">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/[0.08]">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
                    <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-white/[0.01] blur-[100px]" />
                </div>

                <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                        Scripture
                    </p>
                    <h1 className="mt-6 font-serif text-[clamp(2.75rem,8vw,5rem)] leading-[1.05] tracking-tight text-white">
                        OT Apocrypha
                    </h1>
                    <p className="mt-6 max-w-[50ch] font-serif text-lg leading-relaxed text-neutral-400 sm:text-xl">
                        Deuterocanonical and apocryphal books of the Old Testament — texts outside the Hebrew canon.
                    </p>

                    <ScriptureTabs />
                </div>
            </div>

            {/* Coming Soon */}
            <main className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-10 py-12 backdrop-blur-xl">
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                            Coming Soon
                        </p>
                        <h2 className="mt-4 font-serif text-2xl text-white">
                            OT Apocrypha texts are being prepared
                        </h2>
                        <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-neutral-400">
                            Source material for the Old Testament Apocrypha will be added here. Check back soon.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
