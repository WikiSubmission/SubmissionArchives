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

    const palette = darkMode
        ? {
            border: 'border-[#e9dfd3]/10',
            frame: 'bg-[#111111]/86 text-[#f6efe4]',
            muted: 'text-[#cbbca9]/62',
            panel: 'bg-[#181817]/88',
            hover: 'hover:bg-[#ffffff]/[0.04]',
            active: 'bg-[#f6ae82]/10 text-[#f6efe4] border-[#f6ae82]/20',
            idle: 'text-[#cbbca9]/58 border-transparent hover:text-[#f6efe4] hover:border-[#e9dfd3]/10',
            icon: 'text-[#cbbca9]/72',
            iconHover: 'hover:text-[#f6ae82]',
        }
        : {
            border: 'border-[#1b1a18]/14',
            frame: 'bg-[#f3ede4]/86 text-[#1b1a18]',
            muted: 'text-[#625c54]/62',
            panel: 'bg-[#f7f2eb]/92',
            hover: 'hover:bg-[#111111]/[0.04]',
            active: 'bg-[#961515]/8 text-[#1b1a18] border-[#961515]/16',
            idle: 'text-[#625c54] border-transparent hover:text-[#1b1a18] hover:border-[#1b1a18]/12',
            icon: 'text-[#625c54]',
            iconHover: 'hover:text-[#961515]',
        };

    return (
        <header className={`sticky top-0 z-50 border-b ${palette.border} ${palette.frame} backdrop-blur-xl`}>
            <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="group inline-flex items-center gap-3" aria-label="Submission Archives home">
                            <div className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full border ${palette.border} bg-[#111111]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.18)] transition-colors duration-300 group-hover:border-[#f6ae82]/40`}>
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110"
                                />
                            </div>

                            <div className="flex flex-col leading-none">
                                <span className="font-sans text-base font-bold uppercase tracking-tight text-ed-fg transition-colors duration-300 group-hover:text-ed-accent">
                                    SUBMISSION
                                </span>
                                <span
                                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                                    className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors duration-300 group-hover:text-ed-fg ${palette.muted}`}
                                >
                                    ARCHIVES
                                </span>
                            </div>
                        </Link>

                    </div>

                    <div className="hidden lg:flex justify-center">
                        <nav className={`soft-pill flex items-center gap-1 px-1.5 py-1.5`}>
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`rounded-full border px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] transition ${isActive ? palette.active : palette.idle}`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <HeaderIconButton
                                label="Toggle theme"
                                onClick={toggleDarkMode}
                                palette={palette}
                            >
                                {darkMode ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </HeaderIconButton>

                            <a
                                href="https://www.youtube.com/@SubmissionArchives"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <HeaderIconButton label="YouTube" palette={palette}>
                                    <Youtube className="h-4 w-4" />
                                </HeaderIconButton>
                            </a>

                            <a
                                href="https://discord.gg/SubmissionServer"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <HeaderIconButton label="Discord" palette={palette}>
                                    <MessageCircle className="h-4 w-4" />
                                </HeaderIconButton>
                            </a>
                        </div>

                        <button
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className={`soft-pill md:hidden p-2 ${palette.icon} transition ${palette.hover}`}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen ? (
                <div className={`border-t ${palette.border} ${palette.panel} px-4 py-4 md:hidden sm:px-6`}>
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`rounded-full border px-4 py-3 text-sm font-bold uppercase tracking-[0.22em] transition ${isActive ? palette.active : `${palette.idle} ${palette.hover}`}`}
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
    palette,
}: {
    children: React.ReactNode;
    label: string;
    onClick?: () => void;
    palette: {
        border: string;
        panel: string;
        icon: string;
        iconHover: string;
        hover: string;
    };
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className={`soft-pill p-2 ${palette.icon} transition ${palette.hover} ${palette.iconHover}`}
        >
            {children}
        </button>
    );
}
