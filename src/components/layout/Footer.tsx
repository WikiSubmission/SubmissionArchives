'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Youtube } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';

export default function Footer() {
    const { darkMode } = useTheme();

    const palette = darkMode
        ? {
            frame: 'bg-[#111111] text-[#cbbca9]',
            border: 'border-[#e9dfd3]/10',
            text: 'text-[#f6efe4]',
            muted: 'text-[#cbbca9]/62',
            link: 'text-[#d8ccbd]/72 hover:text-[#f6ae82]',
            panel: 'bg-[#181817]',
            icon: 'text-[#cbbca9]/72 hover:text-[#f6ae82]',
            accent: 'text-[#f6ae82]',
        }
        : {
            frame: 'bg-[#efe7dd] text-[#625c54]',
            border: 'border-[#1b1a18]/12',
            text: 'text-[#1b1a18]',
            muted: 'text-[#625c54]/72',
            link: 'text-[#625c54] hover:text-[#961515]',
            panel: 'bg-[#f7f2eb]',
            icon: 'text-[#625c54] hover:text-[#961515]',
            accent: 'text-[#961515]',
        };

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
        <footer className={`w-full border-t ${palette.border} ${palette.frame} px-6 pb-12 pt-20 sm:px-8 lg:px-10`}>
            <div className="mx-auto max-w-[1440px]">
                <div className="soft-shell grid gap-14 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                    <div className="space-y-7">
                        <Link href="/" className="group inline-flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border ${palette.border} ${palette.panel} shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.16)]`}>
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
                            SubmissionArchives platform is designed to preserve, catalogue, and display works in relation to Submission and the Messenger of the Covenant, Dr. Rashad Khalifa. Transcriptions may be error-prone, please use personal judgement if you notice any errors. Verify everything you cite (17:36).
                        </p>

                        <div className="flex items-center gap-3">
                            <FooterIcon href="https://youtube.com/@submissionarchives" palette={palette}>
                                <Youtube className="h-4 w-4" />
                            </FooterIcon>
                            <FooterIcon href="https://discord.gg/submissionserver" palette={palette}>
                                <MessageCircle className="h-4 w-4" />
                            </FooterIcon>
                        </div>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-3 lg:col-span-2">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-5">
                                <p className={`text-[0.66rem] uppercase tracking-[0.24em] ${palette.muted}`}>
                                    {section.title}
                                </p>
                                <ul className="space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link href={link.href} className={`inline-flex rounded-full px-3 py-1.5 text-sm transition hover:bg-ed-fg/[0.04] ${palette.link}`}>
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>



                <div className={`mt-8 flex flex-col gap-4 px-2 pt-4 text-[0.64rem] uppercase tracking-[0.22em] ${palette.muted} sm:flex-row sm:items-center sm:justify-between`}>
                    <div className="flex flex-wrap items-center gap-4">
                        <span>© 2026 Submission Archives</span>
                        <Link href="https://wikisubmission.org/legal/privacy-policy" className={palette.link}>
                            Privacy
                        </Link>
                        <Link href="https://wikisubmission.org/legal/terms-of-use" className={palette.link}>
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
            className={`soft-pill p-2 transition ${palette.icon}`}
        >
            {children}
        </a>
    );
}
