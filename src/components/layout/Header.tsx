'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageCircle, Moon, Sun, X, Youtube } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { PRIMARY_NAV } from '@/config/navigation';
import { DISCORD_URL, YOUTUBE_URL } from '@/config/social';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const [previousPathname, setPreviousPathname] = useState(pathname);
    const menuId = useId();
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

    if (pathname !== previousPathname) {
        setPreviousPathname(pathname);
        setIsMenuOpen(false);
    }

    useEffect(() => {
        if (!isMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.requestAnimationFrame(() => firstMenuLinkRef.current?.focus());

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setIsMenuOpen(false);
            menuButtonRef.current?.focus();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <header className={`sticky top-0 z-50 border-b border-ed-rule text-ed-fg ${isMenuOpen ? 'bg-ed-bg' : 'bg-ed-bg/96 supports-[backdrop-filter]:bg-ed-bg/90 supports-[backdrop-filter]:backdrop-blur-md'}`}>
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
                <div className="grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                    <Link href="/" className="group inline-flex min-h-11 min-w-0 items-center gap-3" aria-label="Submission Archives home">
                        <span className="relative flex shrink-0 items-center justify-center">
                            <Image
                                src="/assets/brand/submission-archives-mark.png"
                                alt=""
                                width={44}
                                height={44}
                                priority
                                className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-[1.08]"
                            />
                        </span>
                        <span className="min-w-0 leading-none">
                            <span className="block truncate text-[0.82rem] font-bold uppercase tracking-[0.08em] text-ed-fg">Submission</span>
                            <span className="mt-1 block truncate font-display text-[1.03rem] text-ed-fg-muted transition-colors group-hover:text-ed-accent">Archives</span>
                        </span>
                    </Link>

                    <nav aria-label="Primary" className="hidden items-stretch lg:flex">
                        {PRIMARY_NAV.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative inline-flex min-h-11 items-center px-3 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-colors ${
                                        isActive ? 'text-ed-fg' : 'text-ed-fg-muted hover:text-ed-fg'
                                    }`}
                                >
                                    {item.name}
                                    <span className={`absolute inset-x-3 bottom-0 h-px bg-ed-accent transition-transform ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center justify-end gap-2">
                        <div className="hidden items-center gap-1 lg:flex">
                            <HeaderIconButton
                                label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                                onClick={toggleDarkMode}
                                pressed={darkMode}
                            >
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </HeaderIconButton>
                            <HeaderIconLink label="YouTube" href={YOUTUBE_URL}><Youtube className="h-4 w-4" /></HeaderIconLink>
                            <HeaderIconLink label="Discord" href={DISCORD_URL}><MessageCircle className="h-4 w-4" /></HeaderIconLink>
                        </div>

                        <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isMenuOpen}
                            aria-controls={menuId}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ed-rule text-ed-fg-muted transition-colors hover:border-ed-accent/50 hover:text-ed-fg lg:hidden"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`fixed inset-0 top-[4.5rem] z-50 lg:hidden transition-[visibility] ${isMenuOpen ? 'visible' : 'invisible'}`}
                style={{ transitionDuration: isMenuOpen ? '0ms' : '350ms' }}
            >
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                    tabIndex={isMenuOpen ? 0 : -1}
                />
                <div
                    id={menuId}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site navigation"
                    className={`relative ml-auto flex h-full w-[min(92vw,26rem)] flex-col border-l border-ed-rule bg-ed-bg px-5 py-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ isolation: 'isolate', opacity: 1 }}
                >
                    <nav aria-label="Mobile primary" className="flex flex-col">
                        {PRIMARY_NAV.map((item, index) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    ref={index === 0 ? firstMenuLinkRef : undefined}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex min-h-14 items-center justify-between border-b border-ed-rule text-lg transition-all duration-300 ${isActive ? 'text-ed-accent' : 'text-ed-fg'}`}
                                    style={{
                                        opacity: isMenuOpen ? 1 : 0,
                                        transform: isMenuOpen ? 'translateX(0)' : 'translateX(1rem)',
                                        transitionDelay: isMenuOpen ? `${80 + index * 40}ms` : '0ms',
                                    }}
                                    tabIndex={isMenuOpen ? 0 : -1}
                                >
                                    {item.name}
                                    <span className="font-mono text-xs text-ed-fg-muted">{String(index + 1).padStart(2, '0')}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div
                        className="mt-auto grid grid-cols-3 gap-2 border-t border-ed-rule pt-5 transition-opacity duration-300"
                        style={{
                            opacity: isMenuOpen ? 1 : 0,
                            transitionDelay: isMenuOpen ? '280ms' : '0ms',
                        }}
                    >
                        <HeaderIconButton
                            label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                            onClick={toggleDarkMode}
                            pressed={darkMode}
                        >
                            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </HeaderIconButton>
                        <HeaderIconLink label="YouTube" href={YOUTUBE_URL}><Youtube className="h-4 w-4" /></HeaderIconLink>
                        <HeaderIconLink label="Discord" href={DISCORD_URL}><MessageCircle className="h-4 w-4" /></HeaderIconLink>
                    </div>
                </div>
            </div>
        </header>
    );
}

function HeaderIconButton({ children, label, onClick, pressed }: { children: ReactNode; label: string; onClick: () => void; pressed?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ed-rule text-ed-fg-muted transition-colors hover:border-ed-accent/50 hover:text-ed-accent"
        >
            {children}
        </button>
    );
}

function HeaderIconLink({ children, label, href }: { children: ReactNode; label: string; href: string }) {
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
