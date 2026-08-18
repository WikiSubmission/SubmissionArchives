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
        <footer className="relative w-full overflow-hidden border-t border-[#2A2928] bg-gradient-to-b from-[#161514]/40 via-[#161514]/15 to-[#0F0E0D] text-[#F5F0EB]">
            {/* Subtle top ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#C8794A]/5 blur-3xl" />

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
                            {/* Brand Mark Tile */}
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-[#2A2928] bg-gradient-to-b from-[#1C1B1A] via-[#161514] to-[#161514] p-2 shadow-md ring-1 ring-white/5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt="Submission Archives"
                                    width={44}
                                    height={44}
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                            <div>
                                <span
                                    className="block text-xl font-semibold tracking-tight text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Submission Archives
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6B6560]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#C8794A]" />
                                    Digital Preservation Project
                                </span>
                            </div>
                        </Link>

                        <p
                            className="max-w-[48ch] text-sm leading-relaxed text-[#9E9690]"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Dedicated to the permanent digital preservation of historical audio recordings, video lectures, authorized scripture translations, and written works related to Submission and Dr. Rashad Khalifa.
                        </p>

                        {/* Verification Principle Card */}
                        <div className="rounded-[8px] border border-[#2A2928] bg-[#161514] p-4 text-xs leading-relaxed text-[#9E9690] shadow-sm">
                            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F5F0EB] mb-1.5">
                                <ShieldCheck className="h-4 w-4 text-[#C8794A]" />
                                <span>Verification Principle (17:36)</span>
                            </div>
                            Transcriptions and OCR copies may contain automated errors. Always verify citations directly against original audio recordings and printed facsimiles.
                        </div>

                        {/* Social & Studio App Links */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <Link
                                href="/app"
                                className="inline-flex items-center gap-2 rounded-[4px] border border-[#C8794A] bg-[#C8794A] px-3.5 py-2 text-xs font-semibold text-[#0F0E0D] shadow-sm transition-all duration-200 hover:bg-[#D9916A] hover:scale-[1.02] active:scale-[0.98]"
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
                <div className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-[#2A2928] pt-8 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[#6B6560]">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        <span className="hidden sm:inline text-[#4A4542]">&middot;</span>
                        {LEGAL_LINKS.map((link) => (
                            link.href.startsWith('http') ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-underline transition-colors hover:text-[#F5F0EB]"
                                >
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="link-underline transition-colors hover:text-[#F5F0EB]"
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
            className="inline-flex items-center gap-2 rounded-[4px] border border-[#2A2928] bg-[#161514] px-3.5 py-2 text-xs font-medium text-[#9E9690] transition-all duration-200 hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] hover:scale-[1.02] active:scale-[0.98]"
        >
            {children}
        </a>
    );
}
