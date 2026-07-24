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
        <header className="sticky top-0 z-50 text-ed-fg px-3 sm:px-6 py-2.5">
            <div className={`mx-auto max-w-5xl rounded-3xl sm:rounded-full border border-ed-rule-strong/50 dark:border-white/15 backdrop-blur-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ${isMenuOpen ? 'bg-ed-bg' : 'bg-ed-surface/90 dark:bg-ed-surface/60 hover:border-ed-rule-strong dark:hover:border-white/25'}`}>
                <div className="px-4 sm:px-6">
                    <div className="grid min-h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                        <Link href="/" className="group inline-flex min-h-11 min-w-0 items-center gap-3" aria-label="Submission Archives home">
                            <Image
                                src="/assets/brand/submission-archives-mark.png"
                                alt=""
                                width={36}
                                height={36}
                                priority
                                loading="eager"
                                className="h-8 w-8 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="min-w-0 leading-none flex flex-col items-start">
                                <span className="block truncate font-sans text-[0.88rem] font-extrabold uppercase tracking-[0.1em] text-ed-fg group-hover:text-ed-accent transition-colors">Submission</span>
                                <span className="mt-0.5 block truncate font-mono text-[0.7rem] font-medium uppercase tracking-[0.15em] text-ed-fg-muted">Archives</span>
                            </span>
                        </Link>

                        <nav aria-label="Primary" className="hidden items-center rounded-full border border-ed-rule/80 dark:border-white/10 bg-black/5 dark:bg-black/40 p-1.5 backdrop-blur-xl shadow-inner lg:flex gap-1">
                            {PRIMARY_NAV.map((item) => {
                                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`relative inline-flex min-h-8 items-center rounded-full px-4 text-[0.68rem] font-mono font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                                            isActive
                                                ? 'bg-ed-fg text-ed-bg shadow-md font-bold'
                                                : 'text-ed-fg-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-ed-fg'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center justify-end gap-2">
                            <div className="hidden items-center gap-1 rounded-full border border-ed-rule/80 dark:border-white/10 bg-black/5 dark:bg-black/40 p-1 backdrop-blur-xl shadow-inner lg:flex">
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
                                className="inline-flex min-h-9 min-w-9 rounded-full items-center justify-center border border-ed-rule-strong/60 dark:border-white/15 bg-black/5 dark:bg-black/40 text-ed-fg-muted transition-all duration-200 hover:border-ed-fg hover:text-ed-fg backdrop-blur-xl lg:hidden"
                            >
                                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`fixed inset-x-0 bottom-0 top-[4.5rem] z-50 lg:hidden transition-[visibility] ${isMenuOpen ? 'visible' : 'invisible'}`}
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ed-fg-muted transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10 hover:text-ed-fg"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ed-fg-muted transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10 hover:text-ed-fg"
        >
            {children}
        </a>
    );
}
