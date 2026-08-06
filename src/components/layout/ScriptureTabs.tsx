'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SCRIPTURE_TABS = [
    { name: "Qur'an", href: '/quran' },
    { name: 'Old Testament', href: '/quran/old-testament' },
    { name: 'New Testament', href: '/quran/new-testament' },
] as const;

export default function ScriptureTabs() {
    const pathname = usePathname();

    return (
        <nav aria-label="Scripture sections" className="mt-8 flex flex-wrap gap-2">
            {SCRIPTURE_TABS.map((tab) => {
                const isActive =
                    tab.href === '/quran'
                        ? pathname === '/quran' || pathname === '/quran/'
                        : pathname.startsWith(tab.href);

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive
                                ? 'border-ed-accent/60 bg-ed-accent/15 text-ed-accent shadow-sm'
                                : 'border-ed-rule text-ed-fg-muted hover:border-ed-accent/40 hover:bg-ed-surface hover:text-ed-fg'
                        }`}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </nav>
    );
}
