import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Youtube } from 'lucide-react';
import type { ReactNode } from 'react';

import { FOOTER_NAV } from '@/config/navigation';
import { DISCORD_URL, LEGAL_LINKS, YOUTUBE_URL } from '@/config/social';

export default function Footer() {
    return (
        <footer className="px-3 sm:px-6 py-8 text-ed-fg" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            <div className="mx-auto max-w-5xl rounded-3xl border border-ed-rule-strong/40 dark:border-white/15 bg-ed-surface/90 dark:bg-ed-surface/50 p-6 sm:p-10 backdrop-blur-2xl shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]">
                <div className="grid gap-10 lg:grid-cols-[1.15fr_1.85fr] lg:gap-16">
                    <div>
                        <Link href="/" className="group inline-flex min-h-11 items-center gap-3.5" aria-label="Submission Archives home">
                            <Image
                                src="/assets/brand/submission-archives-mark.png"
                                alt=""
                                width={44}
                                height={44}
                                className="h-10 w-10 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                            <span>
                                <span className="block font-sans text-xl font-extrabold tracking-tight text-ed-fg group-hover:text-ed-accent transition-colors">Submission Archives</span>
                                <span className="mt-0.5 block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">Digital Preservation Project</span>
                            </span>
                        </Link>

                        <p className="mt-6 max-w-[48ch] font-sans text-sm leading-6 text-ed-fg-muted">
                            Submission Archives preserves works related to Submission and the Messenger of the Covenant, Dr. Rashad Khalifa. Transcriptions can contain errors. Verify passages against their original recordings or scans before citing them (17:36).
                        </p>

                        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-ed-rule-strong/40 dark:border-white/10 bg-black/5 dark:bg-black/40 p-1 backdrop-blur-xl shadow-inner">
                            <FooterIcon href={YOUTUBE_URL} label="YouTube"><Youtube className="h-4 w-4" /></FooterIcon>
                            <FooterIcon href={DISCORD_URL} label="Discord"><MessageCircle className="h-4 w-4" /></FooterIcon>
                        </div>
                    </div>

                    <nav aria-label="Footer" className="grid gap-0 sm:grid-cols-3 sm:gap-8">
                        {FOOTER_NAV.map((section) => (
                            <details key={section.title} className="group border-b border-ed-rule/60 dark:border-white/10 sm:border-b-0" open>
                                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted sm:cursor-default sm:border-b sm:border-ed-rule/60 dark:sm:border-white/10 sm:pb-3 sm:pt-0 [&::-webkit-details-marker]:hidden">
                                    {section.title}
                                    <svg className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                </summary>
                                <ul className="pb-4 sm:mt-3 sm:pb-0 space-y-1">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            {link.href.startsWith('http') ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-9 items-center font-sans text-[0.88rem] text-ed-fg-muted transition-colors hover:text-ed-fg"
                                                >
                                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                                </a>
                                            ) : (
                                                <Link href={link.href} className="inline-flex min-h-9 items-center font-sans text-[0.88rem] text-ed-fg-muted transition-colors hover:text-ed-fg">
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

                <div className="mt-10 grid gap-4 border-t border-ed-rule/60 dark:border-white/10 pt-6 font-mono text-xs text-ed-fg-muted sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        {LEGAL_LINKS.map((link) => (
                            link.href.startsWith('http') ? (
                                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center transition-colors hover:text-ed-fg">
                                    {link.name}<span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            ) : (
                                <Link key={link.name} href={link.href} className="inline-flex min-h-9 items-center transition-colors hover:text-ed-fg">
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </div>
                    <span className="font-sans text-xs font-semibold text-ed-fg">Preserved for careful study.</span>
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ed-fg-muted transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10 hover:text-ed-fg"
        >
            {children}
        </a>
    );
}
