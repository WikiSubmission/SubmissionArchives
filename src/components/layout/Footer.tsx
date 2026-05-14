'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Twitter, Youtube } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';

export default function Footer() {
    const { darkMode } = useTheme();

    const palette = darkMode
        ? {
            frame: 'bg-[#111512] text-[#cbbca9]',
            border: 'border-[#e9dfd3]/10',
            text: 'text-[#f6efe4]',
            muted: 'text-[#cbbca9]/62',
            link: 'text-[#d8ccbd]/72 hover:text-[#f6ae82]',
            panel: 'bg-[#151c18]',
            icon: 'text-[#cbbca9]/72 hover:text-[#f6ae82]',
            accent: 'text-[#f6ae82]',
        }
        : {
            frame: 'bg-[#efe7dd] text-[#5e655f]',
            border: 'border-[#2f381f]/12',
            text: 'text-[#1d221d]',
            muted: 'text-[#5e655f]/72',
            link: 'text-[#4f574f] hover:text-[#961515]',
            panel: 'bg-[#f7f2eb]',
            icon: 'text-[#5e655f] hover:text-[#961515]',
            accent: 'text-[#961515]',
        };

    const sections = [
        {
            title: 'Archive',
            links: [
                { name: 'Video Library', href: '/videos' },
                { name: 'Audio Library', href: '/audios' },
                { name: 'Search Engine', href: '/search' },
                { name: 'Written Material', href: '/other' },
            ],
        },
        {
            title: 'Collections',
            links: [
                { name: 'Quran Studies', href: '/audios' },
                { name: 'Submitter Perspectives', href: '/other' },
                { name: 'Appendices', href: '/other' },
                { name: 'Historical Scans', href: '/other' },
            ],
        },
        {
            title: 'Community',
            links: [
                { name: 'YouTube', href: 'https://youtube.com/@submissionarchives' },
                { name: 'Discord', href: 'https://discord.gg/submission' },
                { name: 'Newsletter Search', href: '/search?types=perspective' },
            ],
        },
    ];

    return (
        <footer className={`w-full border-t ${palette.border} ${palette.frame} px-6 pb-12 pt-20 sm:px-8 lg:px-10`}>
            <div className="mx-auto max-w-[1440px]">
                <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                    <div className="space-y-7">
                        <Link href="/" className="group inline-flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border ${palette.border} ${palette.panel}`}>
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="leading-none">
                                <p className={`font-serif text-xl ${palette.text}`}>Submission</p>
                                <p className={`mt-1 text-[0.63rem] uppercase tracking-[0.32em] ${palette.muted}`}>
                                    Archives
                                </p>
                            </div>
                        </Link>

                        <p className="max-w-sm text-sm leading-7 opacity-85">
                            A study archive for sermons, recordings, newsletters, appendices, and related material.
                            The design goal is sobriety and endurance, not platform spectacle.
                        </p>

                        <div className="flex items-center gap-3">
                            <FooterIcon href="https://youtube.com/@submissionarchives" palette={palette}>
                                <Youtube className="h-4 w-4" />
                            </FooterIcon>
                            <FooterIcon href="https://discord.gg/submission" palette={palette}>
                                <MessageCircle className="h-4 w-4" />
                            </FooterIcon>
                            <FooterIcon href="https://x.com" palette={palette}>
                                <Twitter className="h-4 w-4" />
                            </FooterIcon>
                        </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-3 lg:col-span-2">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-5">
                                <p className={`text-[0.66rem] uppercase tracking-[0.24em] ${palette.muted}`}>
                                    {section.title}
                                </p>
                                <ul className="space-y-3">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link href={link.href} className={`text-sm transition ${palette.link}`}>
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`mt-16 grid gap-px border ${palette.border} bg-current/10 sm:grid-cols-3`}>
                    <FooterStat label="Indexed records" value="1,240+" palette={palette} />
                    <FooterStat label="Editorial mode" value="Dark and light" palette={palette} />
                    <FooterStat label="Version" value="v2.0.4" palette={palette} />
                </div>

                <div className={`mt-12 flex flex-col gap-4 border-t ${palette.border} pt-8 text-[0.64rem] uppercase tracking-[0.22em] ${palette.muted} sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="flex flex-wrap items-center gap-4">
                        <span>© 2026 Submission Archives</span>
                        <Link href="/privacy" className={palette.link}>
                            Privacy
                        </Link>
                        <Link href="/terms" className={palette.link}>
                            Terms
                        </Link>
                    </div>
                    <span className={palette.accent}>Preserving the proofs with clarity</span>
                </div>
            </div>
        </footer>
    );
}

function FooterIcon({
    href,
    children,
    palette,
}: {
    href: string;
    children: React.ReactNode;
    palette: { border: string; panel: string; icon: string };
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`border ${palette.border} ${palette.panel} p-2 transition ${palette.icon}`}
        >
            {children}
        </a>
    );
}

function FooterStat({
    label,
    value,
    palette,
}: {
    label: string;
    value: string;
    palette: { panel: string; text: string; muted: string };
}) {
    return (
        <div className={`${palette.panel} px-5 py-5`}>
            <p className={`font-serif text-2xl ${palette.text}`}>{value}</p>
            <p className={`mt-2 text-[0.62rem] uppercase tracking-[0.22em] ${palette.muted}`}>{label}</p>
        </div>
    );
}
