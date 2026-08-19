'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { BookOpen, Scroll, Books, BookBookmark, Archive, Lightning } from '@phosphor-icons/react';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type TabItem = {
  href: string;
  label: string;
  count: string;
  icon: typeof BookOpen;
  match: (path: string) => boolean;
};

const ALL_TABS: TabItem[] = [
  {
    href: '/scripture/quran',
    label: "Qur'an",
    count: '114 Surahs',
    icon: BookOpen,
    match: (path) =>
      (path === '/scripture/quran' ||
        path === '/quran' ||
        path.startsWith('/scripture/quran/') ||
        path.startsWith('/quran/')) &&
      !path.includes('/appendices'),
  },
  {
    href: '/scripture/quran/appendices',
    label: 'Appendices',
    count: '38 Notes',
    icon: BookBookmark,
    match: (path) =>
      path.includes('/scripture/quran/appendices') || path.includes('/quran/appendices'),
  },
  {
    href: '/scripture/old-testament',
    label: 'Old Testament',
    count: '39 Books',
    icon: Scroll,
    match: (path) =>
      (path === '/scripture/old-testament' ||
        path === '/quran/old-testament' ||
        path.startsWith('/scripture/old-testament/')) &&
      !path.includes('/apocrypha'),
  },
  {
    href: '/scripture/old-testament/apocrypha',
    label: 'OT Apocrypha',
    count: '15 Books',
    icon: Archive,
    match: (path) => path.includes('/old-testament/apocrypha'),
  },
  {
    href: '/scripture/new-testament',
    label: 'New Testament',
    count: '27 Books',
    icon: Books,
    match: (path) =>
      (path === '/scripture/new-testament' ||
        path === '/quran/new-testament' ||
        path.startsWith('/scripture/new-testament/')) &&
      !path.includes('/apocrypha'),
  },
  {
    href: '/scripture/new-testament/apocrypha',
    label: 'NT Apocrypha',
    count: 'Extra Texts',
    icon: Lightning,
    match: (path) => path.includes('/new-testament/apocrypha'),
  },
];

export default function ScriptureTabs() {
  const pathname = usePathname() || '';

  return (
    <nav
      className="mt-8 w-full max-w-4xl"
      aria-label="Scripture navigation"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 rounded-[8px] border border-ed-rule bg-ed-surface backdrop-blur-2xl shadow-sm">
        {ALL_TABS.map((tab) => {
          const isActive = tab.match(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1.5 rounded-[6px] px-3 py-2.5 text-center transition-colors duration-200 active:scale-[0.97]',
                isActive
                  ? 'text-ed-accent font-semibold'
                  : 'text-ed-fg-muted hover:text-ed-fg',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="active-scripture-tab-pill"
                  className="absolute inset-0 rounded-[6px] border border-ed-accent/40 bg-ed-accent-soft shadow-sm"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5">
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors duration-200',
                    isActive ? 'text-ed-accent' : 'text-ed-fg-muted group-hover:text-ed-fg',
                  )}
                  weight={isActive ? 'fill' : 'regular'}
                />
                <span className="text-xs sm:text-sm font-semibold tracking-tight leading-tight">
                  {tab.label}
                </span>
              </div>

              <span
                className={cn(
                  'relative z-10 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium leading-none tabular-nums transition-colors duration-200',
                  isActive
                    ? 'bg-ed-accent/15 text-ed-accent font-bold'
                    : 'bg-ed-bg text-ed-fg-muted group-hover:text-ed-fg',
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
