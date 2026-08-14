import Image from 'next/image';
import Link from 'next/link';
import { Youtube, MessageCircle, ShieldCheck, Laptop } from 'lucide-react';
import type { ReactNode } from 'react';

import { FOOTER_NAV } from '@/config/navigation';
import { DISCORD_URL, LEGAL_LINKS, YOUTUBE_URL } from '@/config/social';
import { FooterAccordionSection } from './FooterAccordionSection';
import { BackToTop } from './BackToTop';

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/40 via-ed-surface/20 to-ed-bg text-ed-fg">
            {/* Subtle top ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-ed-accent/5 blur-3xl" />

            <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
                {/* Main Grid: Brand Identity & Nav Columns */}
                <div className="grid gap-12 lg:grid-cols-[1.15fr_1.85fr] lg:gap-20">
                    {/* Left: Brand Identity & Verification */}
                    <div className="space-y-6">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-4"
                            aria-label="Submission Archives home"
                        >
                            {/* Squircle Brand Mark Tile */}
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[22%] border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface via-ed-surface/90 to-ed-surface/70 p-2 shadow-md ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt="Submission Archives"
                                    width={44}
                                    height={44}
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                            <div>
                                <span className="block font-sans text-xl font-bold tracking-tight text-ed-fg group-hover:text-ed-accent transition-colors">
                                    Submission Archives
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Digital Preservation Project
                                </span>
                            </div>
                        </Link>

                        <p className="max-w-[48ch] text-sm leading-relaxed text-ed-fg-muted">
                            Dedicated to the permanent digital preservation of historical audio recordings, video lectures, authorized scripture translations, and written works related to Submission and Dr. Rashad Khalifa.
                        </p>

                        {/* Elevated Verification Principle Card */}
                        <div className="rounded-2xl border border-ed-rule-strong/70 bg-gradient-to-b from-ed-surface/80 to-ed-surface/40 p-4 text-xs leading-relaxed text-ed-fg-muted shadow-[0_10px_25px_-8px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-xl">
                            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ed-fg mb-1.5">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <span>Verification Principle (17:36)</span>
                            </div>
                            Transcriptions and OCR copies may contain automated errors. Always verify citations directly against original audio recordings and printed facsimiles.
                        </div>

                        {/* Social & Studio App Links */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <Link
                                href="/app"
                                className="inline-flex items-center gap-2 rounded-xl border border-ed-rule-strong/80 bg-ed-fg px-3.5 py-2 text-xs font-semibold text-ed-bg shadow-sm transition-all duration-200 hover:bg-ed-fg/90 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Laptop className="h-3.5 w-3.5" />
                                <span>SA Studio App</span>
                            </Link>

                            <FooterSocialLink href={YOUTUBE_URL} label="YouTube Archive">
                                <Youtube className="h-4 w-4" />
                                <span>YouTube</span>
                            </FooterSocialLink>

                            <FooterSocialLink href={DISCORD_URL} label="Discord Community">
                                <MessageCircle className="h-4 w-4" />
                                <span>Discord</span>
                            </FooterSocialLink>
                        </div>
                    </div>

                    {/* Right: 4-Column Navigation */}
                    <nav aria-label="Footer Navigation" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {FOOTER_NAV.map((section) => (
                            <FooterAccordionSection key={section.title} section={section} />
                        ))}
                    </nav>
                </div>

                {/* Bottom Bar: Copyright, Legal Links, Back To Top */}
                <div className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-ed-rule-strong/60 pt-8 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-ed-fg-muted">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        <span className="hidden sm:inline text-ed-fg-muted/40">&middot;</span>
                        {LEGAL_LINKS.map((link) => (
                            link.href.startsWith('http') ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-ed-fg"
                                >
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="transition-colors hover:text-ed-fg"
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <BackToTop />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterSocialLink({
    href,
    children,
    label,
}: {
    href: string;
    children: ReactNode;
    label: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            className="inline-flex items-center gap-2 rounded-xl border border-ed-rule-strong/70 bg-ed-surface/70 px-3.5 py-2 text-xs font-medium text-ed-fg-muted shadow-sm backdrop-blur-md transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface hover:text-ed-fg hover:scale-[1.02] active:scale-[0.98]"
        >
            {children}
        </a>
    );
}
