'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Youtube } from 'lucide-react';

export default function Footer() {
    const sections = [
        {
            title: 'Archive',
            links: [
                { name: 'Video Library', href: '/videos' },
                { name: 'Audio Library', href: '/audios' },
                { name: 'Search Engine', href: '/search' },
            ],
        },
        {
            title: 'Collections',
            links: [
                { name: 'Video Programs', href: '/videos' },
                { name: 'Friday Sermons', href: '/videos' },
                { name: 'Quran Studies', href: '/audios' },
                { name: 'Messenger Audios', href: '/audios' },
            ],
        },
        {
            title: 'Community',
            links: [
                { name: 'YouTube', href: 'https://youtube.com/@submissionarchives' },
                { name: 'Discord', href: 'https://discord.gg/submissionserver' },
                { name: 'Newsletter Search', href: '/search?filters=perspective' },
            ],
        },
    ];

    return (
        <footer className="w-full border-t border-black/5 bg-[#f7f2eb] px-6 pb-12 pt-20 dark:border-white/5 dark:bg-[#0a0a0a] sm:px-8 lg:px-10 text-ed-fg">
            <div className="mx-auto max-w-[1440px]">
                <div className="grid gap-14 rounded-[1.25rem] border border-black/5 bg-black/[0.02] p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.02)] backdrop-blur-2xl dark:border-white/5 dark:bg-[#111111]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)] sm:p-8 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                    <div className="space-y-7">
                        <Link href="/" className="group inline-flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#111111]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.16)] dark:border-white/10">
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="leading-none">
                                <p className="font-serif text-xl text-ed-fg">Submission</p>
                                <p className="mt-1 text-[0.63rem] uppercase tracking-[0.32em] text-ed-fg-muted">
                                    Archives
                                </p>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm leading-7 text-ed-fg-muted opacity-85">
                            SubmissionArchives platform is designed to preserve, catalogue, and display works in relation to Submission and the Messenger of the Covenant, Dr. Rashad Khalifa. Transcriptions may be error-prone, please use personal judgement if you notice any errors. Verify everything you cite (17:36).
                        </p>

                        <div className="flex items-center gap-3">
                            <FooterIcon href="https://youtube.com/@submissionarchives">
                                <Youtube className="h-4 w-4" />
                            </FooterIcon>
                            <FooterIcon href="https://discord.gg/submissionserver">
                                <MessageCircle className="h-4 w-4" />
                            </FooterIcon>
                        </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-3 lg:col-span-2">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-5">
                                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    {section.title}
                                </p>
                                <ul className="space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="inline-flex rounded-full px-3 py-1.5 text-sm text-ed-fg-muted transition-colors hover:bg-black/5 hover:text-ed-fg dark:hover:bg-white/5"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 px-2 pt-4 text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        <span>© 2026 Submission Archives</span>
                        <Link href="https://wikisubmission.org/legal/privacy-policy" className="transition-colors hover:text-ed-fg">
                            Privacy
                        </Link>
                        <Link href="https://wikisubmission.org/legal/terms-of-use" className="transition-colors hover:text-ed-fg">
                            Terms
                        </Link>
                    </div>
                    <span className="text-ed-accent">Preserving the proofs with clarity</span>
                </div>
            </div>
        </footer>
    );
}

function FooterIcon({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full border border-black/5 bg-black/[0.02] p-2 text-ed-fg-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition hover:bg-black/[0.05] hover:text-ed-accent dark:border-white/5 dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.05]"
        >
            {children}
        </a>
    );
}
