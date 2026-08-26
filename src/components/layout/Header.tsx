'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Menu, MessageCircle, Moon, Sun, X, Youtube } from 'lucide-react';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';




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
        return (
            pathname.startsWith('/written') ||
            pathname.startsWith('/library') ||
            pathname.startsWith('/editorials')
        );
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
            {/* Header — matches modern archival layout */}
            <header
                className="sticky top-0 z-[100] w-full"
                style={{
                    height: 60,
                    borderBottom: '1px solid var(--ed-rule)',
                    background: 'color-mix(in srgb, var(--ed-bg) 90%, transparent)',
                    backdropFilter: 'blur(16px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px var(--ed-shadow)',
                }}
            >
                <div
                    style={{
                        maxWidth: 1160,
                        margin: '0 auto',
                        padding: '0 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    {/* Brand Logo & Title — placement unchanged */}
                    <Link
                        href="/"
                        onClick={closeMenu}
                        className="group inline-flex min-h-11 min-w-0 shrink-0 items-center gap-3"
                        aria-label="Submission Archives home"
                        style={{ textDecoration: 'none' }}
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
                            <span
                                className="block truncate group-hover:text-ed-accent transition-colors"
                                style={{
                                    fontFamily: "'DM Sans', -apple-system, sans-serif",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: '0.02em',
                                    color: 'var(--ed-fg)',
                                    textTransform: 'none',
                                }}
                            >
                                Submission Archives
                            </span>
                        </span>
                    </Link>

                    {/* Primary Desktop Navigation */}
                    <nav
                        aria-label="Primary"
                        className="hidden lg:flex"
                        style={{ gap: 28 }}
                    >
                        {PRIMARY_NAV.map((item) => {
                            const isActive = isNavActive(item.href, pathname);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    style={{
                                        fontFamily: "'DM Sans', -apple-system, sans-serif",
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? 'var(--ed-fg)' : 'var(--ed-fg-secondary)',
                                        textDecoration: 'none',
                                        position: 'relative',
                                        padding: '4px 0',
                                        transition: 'color 0.2s ease',
                                        letterSpacing: '0.01em',
                                    }}
                                    className="header-nav-link hover:text-ed-fg"
                                    data-active={isActive ? 'true' : 'false'}
                                >
                                    {item.name}
                                    {isActive && (
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                position: 'absolute',
                                                bottom: -2,
                                                left: 0,
                                                width: '100%',
                                                height: 1.5,
                                                background: 'var(--ed-accent)',
                                            }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Tools */}
                    <div className="flex items-center gap-2">
                        <div className="hidden items-center sm:flex" style={{ gap: 4 }}>
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

                        {/* Mobile Menu Toggle */}
                        <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isMenuOpen}
                            aria-controls={menuId}
                            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-[6px] border border-ed-rule bg-ed-surface/80 text-ed-fg-muted transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-95 lg:hidden"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
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
                            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${
                                isMenuOpen ? 'opacity-100' : 'opacity-0'
                            }`}
                        />

                        {/* Sliding Dialog Sheet */}
                        <div
                            id={menuId}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Site navigation"
                            className={`relative ml-auto flex h-full w-[min(90vw,22rem)] flex-col px-5 py-6 shadow-2xl transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                            style={{
                                isolation: 'isolate',
                                background: 'color-mix(in srgb, var(--ed-bg) 96%, transparent)',
                                borderLeft: '1px solid var(--ed-rule)',
                            }}
                        >
                            <div className="mb-4 px-1 flex items-center justify-between">
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--ed-fg-faint)',
                                }}>
                                    Navigation
                                </span>
                                <span style={{
                                    fontSize: 11,
                                    color: 'var(--ed-fg-faint)',
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {PRIMARY_NAV.length} sections
                                </span>
                            </div>

                            <nav aria-label="Mobile primary" className="flex flex-col" style={{ gap: 2 }}>
                                {PRIMARY_NAV.map((item, index) => {
                                    const isActive = isNavActive(item.href, pathname);
                                    return (
                                        <Link
                                            key={item.name}
                                            ref={index === 0 ? firstMenuLinkRef : undefined}
                                            href={item.href}
                                            onClick={closeMenu}
                                            aria-current={isActive ? 'page' : undefined}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                minHeight: 48,
                                                padding: '0 12px',
                                                borderRadius: 6,
                                                border: isActive ? '1px solid var(--ed-rule-strong)' : '1px solid transparent',
                                                background: isActive ? 'var(--ed-surface)' : 'transparent',
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 15,
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? 'var(--ed-fg)' : 'var(--ed-fg-muted)',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {isActive && (
                                                    <span
                                                        aria-hidden="true"
                                                        style={{
                                                            display: 'inline-block',
                                                            width: 5,
                                                            height: 5,
                                                            borderRadius: '50%',
                                                            background: 'var(--ed-accent)',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                                <span>{item.name}</span>
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--ed-fg-faint)', fontVariantNumeric: 'tabular-nums' }}>
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto" style={{ borderTop: '1px solid var(--ed-rule)', paddingTop: 16 }}>
                                <div className="flex items-center justify-between px-1">
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ed-fg-muted)' }}>
                                        Theme &amp; Social
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

const headerIconSurfaceClass =
    'inline-flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border border-ed-rule bg-transparent text-ed-fg-muted transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface hover:text-ed-fg active:scale-95';

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
            className={headerIconSurfaceClass}
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
            className={`${headerIconSurfaceClass} no-underline`}
        >
            {children}
        </a>
    );
}
