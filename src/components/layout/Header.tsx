'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, MessageCircle, Moon, Sun, X, Youtube } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';
import { usePathname } from 'next/navigation';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', href: '/' },
        { name: 'Videos', href: '/videos' },
        { name: 'Audios', href: '/audios' },
        { name: 'Search', href: '/search' },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f2eb]/70 backdrop-blur-2xl dark:border-white/5 dark:bg-[#0a0a0a]/70 text-ed-fg">
            <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href="/" className="group inline-flex min-w-0 items-center gap-3" aria-label="Submission Archives home">
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-black/10 bg-[#111111]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.18)] transition-colors duration-300 group-hover:border-ed-accent/40 dark:border-white/10">
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110"
                                />
                            </div>

                            <div className="flex min-w-0 flex-col leading-none">
                                <span className="font-sans text-base font-bold uppercase tracking-tight text-ed-fg transition-colors duration-300 group-hover:text-ed-accent">
                                    SUBMISSION
                                </span>
                                <span
                                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                                    className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ed-fg-muted transition-colors duration-300 group-hover:text-ed-fg"
                                >
                                    ARCHIVES
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden lg:flex justify-center">
                        <nav className="flex items-center gap-1 rounded-full border border-black/5 bg-black/[0.02] p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/5 dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`rounded-full px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] transition-all ${
                                            isActive
                                                ? 'bg-black/5 text-ed-fg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                                                : 'text-ed-fg-muted hover:bg-black/5 hover:text-ed-fg dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <HeaderIconButton label="Toggle theme" onClick={toggleDarkMode}>
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </HeaderIconButton>

                            <a href="https://www.youtube.com/@SubmissionArchives" target="_blank" rel="noopener noreferrer">
                                <HeaderIconButton label="YouTube">
                                    <Youtube className="h-4 w-4" />
                                </HeaderIconButton>
                            </a>

                            <a href="https://discord.gg/SubmissionServer" target="_blank" rel="noopener noreferrer">
                                <HeaderIconButton label="Discord">
                                    <MessageCircle className="h-4 w-4" />
                                </HeaderIconButton>
                            </a>
                        </div>

                        <button
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="flex items-center justify-center rounded-full border border-black/5 bg-black/[0.02] p-2 text-ed-fg-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition hover:bg-black/[0.05] hover:text-ed-fg dark:border-white/5 dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.05] md:hidden"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen ? (
                <div className="border-t border-black/5 bg-[#f7f2eb]/90 px-4 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/90 sm:px-6 md:hidden">
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`rounded-full border px-4 py-3 text-sm font-bold uppercase tracking-[0.22em] transition ${
                                        isActive
                                            ? 'border-black/10 bg-black/5 text-ed-fg dark:border-white/10 dark:bg-white/10'
                                            : 'border-transparent text-ed-fg-muted hover:bg-black/5 hover:text-ed-fg dark:hover:bg-white/5'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </header>
    );
}

function HeaderIconButton({
    children,
    label,
    onClick,
}: {
    children: React.ReactNode;
    label: string;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className="flex items-center justify-center rounded-full border border-black/5 bg-black/[0.02] p-2 text-ed-fg-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition hover:bg-black/[0.05] hover:text-ed-accent dark:border-white/5 dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.05]"
        >
            {children}
        </button>
    );
}
