'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, MessageCircle, Moon, Sun, X, Youtube } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV } from '@/config/navigation';
import { YOUTUBE_URL, DISCORD_URL } from '@/config/social';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lastPathname, setLastPathname] = useState<string | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();

    const navItems = PRIMARY_NAV;

    // Close the mobile menu on navigation, adjusting state during render
    // instead of in an effect (https://react.dev/learn/you-might-not-need-an-effect).
    if (lastPathname !== pathname) {
        setLastPathname(pathname);
        if (isMenuOpen) setIsMenuOpen(false);
    }

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen]);

    return (
        <header className="sticky top-0 z-50 border-b border-ed-rule bg-ed-bg text-ed-fg">
            <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href="/" className="group inline-flex min-h-11 min-w-0 items-center gap-3" aria-label="Submission Archives home">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-ed-rule bg-[#111111] transition-colors duration-300 group-hover:border-ed-accent">
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110"
                                />
                            </div>

                            <div className="flex min-w-0 flex-col leading-none">
                                <span className="font-sans text-[0.95rem] font-bold uppercase tracking-[0.02em] text-ed-fg transition-colors duration-300 group-hover:text-ed-accent">
                                    SUBMISSION
                                </span>
                                <span className="mt-1 font-sans text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ed-fg-muted transition-colors duration-300 group-hover:text-ed-fg">
                                    ARCHIVES
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden lg:flex justify-center">
                        <nav aria-label="Primary" className="flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                            isActive
                                                ? 'bg-ed-surface text-ed-fg'
                                                : 'text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <div className="-my-1 hidden items-center gap-2 lg:flex">
                            <HeaderIconButton
                                label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                                onClick={toggleDarkMode}
                                pressed={darkMode}
                            >
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </HeaderIconButton>

                            <HeaderIconLink label="YouTube" href={YOUTUBE_URL}>
                                <Youtube className="h-4 w-4" />
                            </HeaderIconLink>

                            <HeaderIconLink label="Discord" href={DISCORD_URL}>
                                <MessageCircle className="h-4 w-4" />
                            </HeaderIconLink>
                        </div>

                        <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="-my-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-ed-rule bg-transparent p-2 text-ed-fg-muted transition hover:bg-ed-surface hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent lg:hidden"
                            aria-label="Menu"
                            aria-expanded={isMenuOpen}
                            aria-controls="mobile-menu"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen ? (
                <div className="border-t border-ed-rule bg-ed-bg px-4 py-4 sm:px-6 lg:hidden">
                    <nav id="mobile-menu" aria-label="Primary">
                        <div className="flex flex-col gap-2">
                            {navItems.map((item) => {
                                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`rounded-lg border px-4 py-3 text-sm font-semibold tracking-[0.02em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                            isActive
                                                ? 'border-ed-rule bg-ed-surface text-ed-fg'
                                                : 'border-transparent text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-ed-rule pt-4">
                            <HeaderIconButton
                                label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                                onClick={toggleDarkMode}
                                pressed={darkMode}
                            >
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </HeaderIconButton>

                            <HeaderIconLink label="YouTube" href={YOUTUBE_URL}>
                                <Youtube className="h-4 w-4" />
                            </HeaderIconLink>

                            <HeaderIconLink label="Discord" href={DISCORD_URL}>
                                <MessageCircle className="h-4 w-4" />
                            </HeaderIconLink>
                        </div>
                    </nav>
                </div>
            ) : null}
        </header>
    );
}

function HeaderIconButton({
    children,
    label,
    onClick,
    pressed,
}: {
    children: React.ReactNode;
    label: string;
    onClick?: () => void;
    pressed?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-ed-rule bg-transparent p-2 text-ed-fg-muted transition hover:bg-ed-surface hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
        >
            {children}
        </button>
    );
}

function HeaderIconLink({
    children,
    label,
    href,
}: {
    children: React.ReactNode;
    label: string;
    href: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-ed-rule bg-transparent p-2 text-ed-fg-muted transition hover:bg-ed-surface hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
        >
            {children}
        </a>
    );
}
