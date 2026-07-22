import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Youtube } from 'lucide-react';
import type { ReactNode } from 'react';

import { FOOTER_NAV } from '@/config/navigation';
import { DISCORD_URL, LEGAL_LINKS, YOUTUBE_URL } from '@/config/social';

export default function Footer() {
    return (
        <footer className="border-t border-ed-rule bg-ed-bg px-4 pt-14 text-ed-fg sm:px-6 lg:px-10 lg:pt-20" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            <div className="mx-auto max-w-[1440px]">
                <div className="grid gap-12 lg:grid-cols-[1.15fr_1.85fr] lg:gap-20">
                    <div>
                        <Link href="/" className="group inline-flex min-h-11 items-center gap-4" aria-label="Submission Archives home">
                            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-ed-rule bg-[#111111]">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt=""
                                    width={56}
                                    height={56}
                                    className="h-12 w-12 object-contain p-1 transition-transform duration-300 group-hover:scale-[1.04]"
                                />
                            </span>
                            <span>
                                <span className="block font-display text-2xl leading-none text-ed-fg">Submission Archives</span>
                                <span className="mt-2 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ed-fg-muted">Digital preservation project</span>
                            </span>
                        </Link>

                        <p className="mt-7 max-w-[48ch] text-[0.94rem] leading-7 text-ed-fg-muted">
                            Submission Archives preserves works related to Submission and the Messenger of the Covenant, Dr. Rashad Khalifa. Transcriptions can contain errors. Verify passages against their original recordings or scans before citing them (17:36).
                        </p>

                        <div className="mt-7 flex items-center gap-2">
                            <FooterIcon href={YOUTUBE_URL} label="YouTube"><Youtube className="h-4 w-4" /></FooterIcon>
                            <FooterIcon href={DISCORD_URL} label="Discord"><MessageCircle className="h-4 w-4" /></FooterIcon>
                        </div>
                    </div>

                    <nav aria-label="Footer" className="grid gap-0 sm:grid-cols-3 sm:gap-10">
                        {FOOTER_NAV.map((section) => (
                            <details key={section.title} className="group border-b border-ed-rule sm:border-b-0" open>
                                <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted sm:cursor-default sm:border-b sm:border-ed-rule sm:pb-3 sm:pt-0 [&::-webkit-details-marker]:hidden">
                                    {section.title}
                                    <svg className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                </summary>
                                <ul className="pb-4 sm:mt-3 sm:pb-0">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            {link.href.startsWith('http') ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-11 items-center text-[0.92rem] text-ed-fg-muted transition-colors hover:text-ed-accent"
                                                >
                                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                                </a>
                                            ) : (
                                                <Link href={link.href} className="inline-flex min-h-11 items-center text-[0.92rem] text-ed-fg-muted transition-colors hover:text-ed-accent">
                                                    {link.name}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ))}
                    </nav>
                </div>

                <div className="mt-12 grid gap-5 border-t border-ed-rule pt-6 text-sm text-ed-fg-muted sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        {LEGAL_LINKS.map((link) => (
                            link.href.startsWith('http') ? (
                                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center transition-colors hover:text-ed-fg">
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link key={link.name} href={link.href} className="inline-flex min-h-11 items-center transition-colors hover:text-ed-fg">
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </div>
                    <span className="font-display text-lg text-ed-accent">Preserved for careful study.</span>
                </div>
            </div>
        </footer>
    );
}

function FooterIcon({ href, children, label }: { href: string; children: ReactNode; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ed-rule text-ed-fg-muted transition-colors hover:border-ed-accent/50 hover:text-ed-accent"
        >
            {children}
        </a>
    );
}
