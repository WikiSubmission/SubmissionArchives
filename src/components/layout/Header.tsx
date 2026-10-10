"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { PRIMARY_NAV } from '@/config/navigation';
import { DISCORD_URL, YOUTUBE_URL } from '@/config/social';
import { useTheme } from '@/components/providers/ThemeProvider';

const emptySubscribe = () => () => {};
const navigation = PRIMARY_NAV.filter((item) => item.href !== '/search');
function isNavActive(href: string, pathname: string) {
    if (href === '/') return pathname === '/';
    if (href === '/scripture/quran') return pathname.startsWith('/scripture') || pathname.startsWith('/quran');
    if (href === '/written') return ['/written', '/library', '/editorials'].some((prefix) => pathname.startsWith(prefix));
    return pathname.startsWith(href);
}

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const pathname = usePathname();
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [previousPath, setPreviousPath] = useState(pathname);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    if (previousPath !== pathname) {
        setPreviousPath(pathname);
        setIsMenuOpen(false);
    }
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (!isMenuOpen) {
            if (dialog.open) dialog.close();
            return;
        }
        dialog.showModal();
        const overflow = document.body.style.overflow;
        const toggle = toggleRef.current;
        document.body.style.overflow = 'hidden';
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => { if (desktop.matches) setIsMenuOpen(false); };
        desktop.addEventListener('change', closeOnDesktop);
        return () => {
            document.body.style.overflow = overflow;
            desktop.removeEventListener('change', closeOnDesktop);
            if (dialog.open) dialog.close();
            toggle?.focus();
        };
    }, [isMenuOpen, isClient]);
    return (
        <>
            <header className="site-masthead">
                <div className="masthead-inner">
                    <Link href="/" aria-label="Submission Archives home" className="masthead-brand">
                        <Image src="/assets/brand/submission-archives-mark.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" />
                        <span>Submission <span className="font-normal">Archives</span></span>
                    </Link>
                    <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex xl:gap-7">
                        {navigation.map((item) => <Link key={item.href} href={item.href} aria-current={isNavActive(item.href, pathname) ? 'page' : undefined} className="masthead-link">{item.name}</Link>)}
                    </nav>
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <Link href="/search" aria-label="Search the archive" className="masthead-search"><Search size={16} aria-hidden /><span className="hidden sm:inline">Search</span></Link>
                        <button type="button" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={darkMode} className="masthead-tool">{darkMode ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}</button>
                        <button ref={toggleRef} type="button" className="masthead-tool lg:hidden" aria-label="Open navigation menu" aria-expanded={isMenuOpen} aria-controls={menuId} onClick={() => setIsMenuOpen(true)}><Menu size={20} aria-hidden /></button>
                    </div>
                </div>
            </header>
            {isClient && createPortal(
                <dialog ref={dialogRef} id={menuId} className="site-menu" aria-labelledby={`${menuId}-title`} onClose={() => setIsMenuOpen(false)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Tab') return;
                        const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
                        const first = controls[0];
                        const last = controls[controls.length - 1];
                        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                    }}
                    onClick={(event) => { if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) setIsMenuOpen(false); }}>
                    <div className="flex items-center justify-between border-b border-ed-rule pb-5">
                        <span id={`${menuId}-title`} className="font-serif text-xl text-ed-fg">Explore the archive</span>
                        <button type="button" className="masthead-tool" aria-label="Close navigation menu" onClick={() => setIsMenuOpen(false)}><X size={20} aria-hidden /></button>
                    </div>
                    <nav aria-label="Mobile primary" className="my-5 flex flex-col">
                        {PRIMARY_NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} aria-current={isNavActive(item.href, pathname) ? 'page' : undefined} className="mobile-masthead-link"><span>{item.name}</span><ArrowUpRight size={17} aria-hidden /></Link>)}
                    </nav>
                    <div className="mt-auto border-t border-ed-rule pt-6">
                        <p className="mb-4 text-sm leading-relaxed text-ed-fg-muted">Original recordings. Preserved editions. Open to study.</p>
                        <div className="flex gap-6 text-sm text-ed-fg-secondary">
                            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">YouTube<span className="sr-only"> (opens in a new tab)</span></a>
                            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord<span className="sr-only"> (opens in a new tab)</span></a>
                        </div>
                    </div>
                </dialog>, document.body
            )}
        </>
    );
}
