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
        <footer className="relative w-full overflow-hidden border-t border-ed-rule bg-gradient-to-b from-ed-surface/50 via-ed-surface/20 to-ed-bg text-ed-fg">
            {/* Subtle top ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-ed-accent/5 blur-3xl" />

            <div className="relative mx-auto max-w-[1160px] px-5 py-10 sm:px-8 sm:py-12 lg:py-14">
                {/* Main Grid: Brand Identity & Nav Columns */}
                <div className="grid gap-8 lg:grid-cols-[1fr_1.75fr] lg:gap-12">
                    {/* Left: Brand Identity & Verification */}
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-3.5"
                            aria-label="Submission Archives home"
                        >
                            {/* Brand Mark Tile */}
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px] border border-ed-rule bg-gradient-to-b from-ed-surface-strong via-ed-surface to-ed-surface p-1.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="h-7 w-7 object-contain"
                                />
                            </div>
                            <div>
                                <span
                                    className="block text-lg font-semibold tracking-tight text-ed-fg transition-colors group-hover:text-ed-accent"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Submission Archives
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 font-sans text-[0.65rem] font-semibold text-ed-fg-muted">
                                    <span className="h-1.5 w-1.5 rounded-full bg-ed-accent" />
                                    Digital Preservation Project
                                </span>
                            </div>
                        </Link>

                        <p
                            className="max-w-[42ch] text-xs leading-relaxed text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Dedicated to the permanent digital preservation of historical audio recordings, video lectures, authorized scripture translations, and written works related to Submission and Dr. Rashad Khalifa.
                        </p>

                        {/* Verification Principle Card */}
                        <div className="rounded-[6px] border border-ed-rule bg-ed-surface/70 p-3 text-[11px] leading-relaxed text-ed-fg-secondary shadow-xs">
                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ed-fg mb-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-ed-accent" />
                                <span>Verification Principle (17:36)</span>
                            </div>
                            Transcriptions and OCR copies may contain automated errors. Always verify citations directly against original audio recordings and printed facsimiles.
                        </div>

                        {/* Social & Studio App Links */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <Link
                                href="/app"
                                className="inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent bg-ed-accent px-3 py-1.5 text-xs font-semibold text-white dark:text-[#0F0E0D] shadow-xs transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Laptop className="h-3.5 w-3.5" />
                                <span>SA Studio App</span>
                            </Link>

                            <FooterSocialLink href={YOUTUBE_URL} label="YouTube Archive">
                                <Youtube className="h-3.5 w-3.5" />
                                <span>YouTube</span>
                            </FooterSocialLink>

                            <FooterSocialLink href={DISCORD_URL} label="Discord Community">
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>Discord</span>
                            </FooterSocialLink>
                        </div>
                    </div>

                    {/* Right: 4-Column Navigation */}
                    <nav aria-label="Footer Navigation" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {FOOTER_NAV.map((section) => (
                            <FooterAccordionSection key={section.title} section={section} />
                        ))}
                    </nav>
                </div>

                {/* Bottom Bar: Copyright, Legal Links, Back To Top */}
                <div className="mt-10 flex flex-col-reverse items-start justify-between gap-4 border-t border-ed-rule pt-6 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-ed-fg-muted">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        <span className="hidden sm:inline text-ed-fg-faint">&middot;</span>
                        {LEGAL_LINKS.map((link) => (
                            link.href.startsWith('http') ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-underline transition-colors hover:text-ed-fg"
                                >
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="link-underline transition-colors hover:text-ed-fg"
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
            className="inline-flex items-center gap-2 rounded-[4px] border border-ed-rule bg-ed-surface px-3.5 py-2 text-xs font-medium text-ed-fg-secondary transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg hover:scale-[1.02] active:scale-[0.98]"
        >
            {children}
        </a>
    );
}
