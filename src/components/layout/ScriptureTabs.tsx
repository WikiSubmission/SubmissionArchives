'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Scroll, Books, BookBookmark, Archive, Lightning } from '@phosphor-icons/react';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  {
    href: '/scripture/quran',
    label: "Qur'an",
    icon: BookOpen,
    description: '114 Surahs',
  },
  {
    href: '/scripture/old-testament',
    label: 'Old Testament',
    icon: Scroll,
    description: '39 Books',
  },
  {
    href: '/scripture/new-testament',
    label: 'New Testament',
    icon: Books,
    description: '27 Books',
  },
];

const secondaryTabs = [
  {
    href: '/scripture/quran/appendices',
    label: 'Appendices',
    icon: BookBookmark,
    description: '38 Notes',
  },
  {
    href: '/scripture/old-testament/apocrypha',
    label: 'OT Apocrypha',
    icon: Archive,
    description: '15 Books',
  },
  {
    href: '/scripture/new-testament/apocrypha',
    label: 'NT Apocrypha',
    icon: Lightning,
    description: 'Extra Texts',
  },
];

export default function ScriptureTabs() {
  const pathname = usePathname();

  const isAppendicesActive = pathname?.startsWith('/scripture/quran/appendices');

  return (
    <nav
      className="mt-10 inline-flex flex-col gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-2xl shadow-xl shadow-black/40"
      aria-label="Scripture navigation"
    >
      {/* Row 1: Main scripture tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/scripture/quran'
              ? (pathname === '/scripture/quran' || pathname === '/scripture/quran/') && !isAppendicesActive
              : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                isActive
                  ? 'bg-white text-black font-semibold shadow-lg shadow-black/30'
                  : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-black' : 'text-neutral-300 group-hover:text-white',
                )}
                weight={isActive ? 'fill' : 'regular'}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-black/10 text-black/70' : 'bg-white/[0.06] text-neutral-300',
                )}
              >
                {tab.description}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Row 2: Secondary tabs — Appendices, OT Apocrypha, NT Apocrypha */}
      <div className="flex flex-wrap gap-1.5">
        {secondaryTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                isActive
                  ? 'bg-white text-black font-semibold shadow-lg shadow-black/30'
                  : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-black' : 'text-neutral-300 group-hover:text-white',
                )}
                weight={isActive ? 'fill' : 'regular'}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-black/10 text-black/70' : 'bg-white/[0.06] text-neutral-300',
                )}
              >
                {tab.description}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
