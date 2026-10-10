import Link from 'next/link';
import { DISCORD_URL, LEGAL_LINKS, YOUTUBE_URL } from '@/config/social';
import { BackToTop } from './BackToTop';

const columns = [
    { title: 'Archive', links: [{ name: 'Video recordings', href: '/videos' }, { name: 'Audio recordings', href: '/audios' }, { name: 'Books & newsletters', href: '/written' }, { name: 'Editorials', href: '/editorials' }] },
    { title: 'Scripture', links: [{ name: 'The Quran', href: '/scripture/quran' }, { name: 'Old Testament', href: '/scripture/old-testament' }, { name: 'New Testament', href: '/scripture/new-testament' }, { name: 'Appendices', href: '/scripture/quran/appendices' }] },
];
export default function Footer() {
    return (
        <footer className="site-footer" aria-label="Site footer">
            <div className="mx-auto max-w-[1160px] px-5 py-10 sm:px-8 lg:py-12">
                <div className="grid grid-cols-2 gap-x-8 gap-y-9 md:grid-cols-[1fr_1fr_1.4fr] md:gap-16">
                    {columns.map((column) => (
                        <nav key={column.title} aria-label={`${column.title} footer navigation`}>
                            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.13em] text-ed-fg-muted">{column.title}</h2>
                            <ul className="space-y-2">
                                {column.links.map((link) => <li key={link.href}><Link href={link.href} className="footer-text-link">{link.name}</Link></li>)}
                            </ul>
                        </nav>
                    ))}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="font-serif text-xl tracking-tight text-ed-fg">Submission Archives</Link>
                        <p className="mt-3 max-w-[38ch] text-[13px] leading-[1.75] text-ed-fg-muted">Preserving the recordings and written works of Dr. Rashad Khalifa for independent study.</p>
                        <Link href="/app" className="footer-text-link mt-3 inline-block">Explore SA Studio <span aria-hidden>↗</span></Link>
                    </div>
                </div>
                <div className="mt-9 flex flex-col gap-5 border-t border-ed-rule pt-5 text-[11px] text-ed-fg-muted sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                        <span>© {new Date().getFullYear()} Submission Archives</span>
                        {LEGAL_LINKS.map((link) => <Link key={link.href} href={link.href} className="hover:text-ed-fg">{link.name}</Link>)}
                    </div>
                    <div className="flex items-center gap-5">
                        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ed-fg">YouTube<span className="sr-only"> (opens in a new tab)</span></a>
                        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ed-fg">Discord<span className="sr-only"> (opens in a new tab)</span></a>
                        <BackToTop />
                    </div>
                </div>
            </div>
        </footer>
    );
}
