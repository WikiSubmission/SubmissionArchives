'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Menu, MessageCircle, Moon, Sun, X, Youtube } from 'lucide-react';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import { motion } from 'motion/react';

import { PRIMARY_NAV } from '@/config/navigation';
import { DISCORD_URL, YOUTUBE_URL } from '@/config/social';
import { useTheme } from '@/components/providers/ThemeProvider';

const emptySubscribe = () => () => {};

function isNavActive(itemHref: string, pathname: string): boolean {
    if (itemHref === '/') return pathname === '/';
    if (itemHref === '/scripture/quran') {
        return pathname.startsWith('/scripture') || pathname.startsWith('/quran');
    }
    if (itemHref === '/written') {
        return pathname.startsWith('/written') || pathname.startsWith('/library');
    }
    if (itemHref === '/videos') {
        return pathname.startsWith('/videos');
    }
    if (itemHref === '/audios') {
        return pathname.startsWith('/audios');
    }
    return pathname.startsWith(itemHref);
}

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const [prevPathname, setPrevPathname] = useState(pathname);
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const menuId = useId();
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

    // Adjust state during render when pathname changes (avoids cascading effect setState)
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setIsMenuOpen(false);
    }

    // Handle scroll locking & keyboard trap when open
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

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            <header className="sticky top-0 z-[100] w-full border-b border-ed-rule bg-ed-bg/98 dark:bg-ed-bg/98 backdrop-blur-2xl text-ed-fg shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.4)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Brand Logo & Title */}
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="group inline-flex min-h-11 min-w-0 items-center gap-3 shrink-0"
                            aria-label="Submission Archives home"
                        >
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
                                <span className="block truncate font-sans text-[0.88rem] font-extrabold uppercase tracking-[0.1em] text-ed-fg group-hover:text-ed-accent transition-colors">
                                    Submission
                                </span>
                                <span className="mt-0.5 block truncate font-mono text-[0.7rem] font-medium uppercase tracking-[0.15em] text-ed-fg-muted">
                                    Archives
                                </span>
                            </span>
                        </Link>

                        {/* Primary Desktop Navigation */}
                        <nav
                            aria-label="Primary"
                            className="hidden items-center rounded-full border border-ed-rule/80 dark:border-white/10 bg-ed-surface/80 dark:bg-white/[0.04] p-1 backdrop-blur-xl shadow-inner lg:flex gap-0.5"
                        >
                            {PRIMARY_NAV.map((item) => {
                                const isActive = isNavActive(item.href, pathname);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`relative inline-flex min-h-8 items-center rounded-full px-4 text-[0.72rem] font-mono font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
                                            isActive
                                                ? 'text-ed-bg font-bold'
                                                : 'text-ed-fg-muted hover:text-ed-fg'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-header-nav-pill"
                                                className="absolute inset-0 rounded-full bg-ed-fg shadow-sm"
                                                transition={{
                                                    duration: 0.24,
                                                    ease: [0.16, 1, 0.3, 1],
                                                }}
                                            />
                                        )}
                                        <span className="relative z-10">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Tools & Theme Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="hidden items-center gap-1 rounded-full border border-ed-rule/80 dark:border-white/10 bg-ed-surface/80 dark:bg-white/[0.04] p-1 backdrop-blur-xl shadow-inner sm:flex">
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

                            {/* Mobile Menu Toggle Button */}
                            <button
                                ref={menuButtonRef}
                                type="button"
                                onClick={() => setIsMenuOpen((open) => !open)}
                                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                                aria-expanded={isMenuOpen}
                                aria-controls={menuId}
                                className="inline-flex min-h-10 min-w-10 rounded-xl items-center justify-center border border-ed-rule-strong/60 dark:border-white/15 bg-ed-surface/80 dark:bg-white/[0.04] text-ed-fg-muted transition-all duration-200 hover:border-ed-fg hover:text-ed-fg backdrop-blur-xl lg:hidden"
                            >
                                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer Portal (rendered into body to prevent backdrop-filter containing block constraint) */}
            {isClient &&
                createPortal(
                    <div
                        className={`fixed inset-x-0 bottom-0 top-16 z-[110] overflow-hidden lg:hidden transition-[visibility] duration-250 ${
                            isMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
                        }`}
                    >
                        {/* Backdrop overlay */}
                        <div
                            aria-hidden="true"
                            onClick={closeMenu}
                            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${
                                isMenuOpen ? 'opacity-100' : 'opacity-0'
                            }`}
                        />

                        {/* Sliding Dialog Sheet */}
                        <div
                            id={menuId}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Site navigation"
                            className={`relative ml-auto flex h-full w-[min(90vw,24rem)] flex-col border-l border-ed-rule-strong/80 bg-ed-bg px-5 py-6 shadow-2xl transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                            style={{ isolation: 'isolate' }}
                        >
                            <div className="mb-3 px-2 flex items-center justify-between">
                                <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ed-fg-muted">
                                    Archive Portals
                                </span>
                                <span className="rounded-full border border-ed-rule bg-ed-surface px-2 py-0.5 font-mono text-[0.62rem] text-ed-fg-muted">
                                    {PRIMARY_NAV.length} Sections
                                </span>
                            </div>

                            <nav aria-label="Mobile primary" className="flex flex-col space-y-1">
                                {PRIMARY_NAV.map((item, index) => {
                                    const isActive = isNavActive(item.href, pathname);
                                    return (
                                        <Link
                                            key={item.name}
                                            ref={index === 0 ? firstMenuLinkRef : undefined}
                                            href={item.href}
                                            onClick={closeMenu}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`group flex min-h-[3.25rem] items-center justify-between rounded-xl px-3.5 text-base font-semibold transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-ed-surface border border-ed-rule-strong/80 text-ed-fg font-bold shadow-sm'
                                                    : 'text-ed-fg-muted hover:bg-ed-surface/60 hover:text-ed-fg'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`inline-flex h-2 w-2 rounded-full transition-all ${
                                                        isActive
                                                            ? 'bg-ed-fg scale-100'
                                                            : 'bg-transparent scale-0 group-hover:bg-ed-rule-strong group-hover:scale-75'
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                                <span className="tracking-tight">{item.name}</span>
                                            </div>
                                            <span className="font-mono text-[0.72rem] text-ed-fg-muted/60 group-hover:text-ed-fg-muted transition-colors">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto border-t border-ed-rule pt-4">
                                <div className="flex items-center justify-between px-2">
                                    <span className="font-mono text-[0.7rem] text-ed-fg-muted">
                                        Theme & Social
                                    </span>
                                    <div className="flex items-center gap-1.5">
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
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

function HeaderIconButton({
    children,
    label,
    onClick,
    pressed,
}: {
    children: ReactNode;
    label: string;
    onClick: () => void;
    pressed?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ed-rule/60 bg-ed-surface/60 text-ed-fg-muted transition-all duration-200 hover:bg-ed-surface hover:text-ed-fg hover:border-ed-rule-strong"
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
    children: ReactNode;
    label: string;
    href: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ed-rule/60 bg-ed-surface/60 text-ed-fg-muted transition-all duration-200 hover:bg-ed-surface hover:text-ed-fg hover:border-ed-rule-strong"
        >
            {children}
        </a>
    );
}
