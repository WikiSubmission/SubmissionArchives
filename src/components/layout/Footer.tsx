import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Youtube } from 'lucide-react';

const sections = [
    {
        title: 'Archive',
        links: [
            { name: 'Video library', href: '/videos' },
            { name: 'Audio library', href: '/audios' },
            { name: 'Written archive', href: '/written' },
            { name: "Qur'an editions", href: '/quran' },
        ],
    },
    {
        title: 'Research',
        links: [
            { name: 'Search the archive', href: '/search' },
            { name: 'Video programs', href: '/videos#programs' },
            { name: 'Friday sermons', href: '/videos#sermons' },
            { name: 'Newsletter search', href: '/search?filters=perspective' },
        ],
    },
    {
        title: 'Community',
        links: [
            { name: 'YouTube', href: 'https://youtube.com/@submissionarchives' },
            { name: 'Discord', href: 'https://discord.gg/submissionserver' },
            { name: 'Quran studies', href: '/audios#quran-studies' },
            { name: 'Messenger audios', href: '/audios#messenger-audios' },
        ],
    },
];

const sectionLinkClasses =
    'inline-flex min-h-11 items-center rounded-md px-2 py-2 text-[0.95rem] text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

const legalLinkClasses =
    '-mx-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm transition-colors hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent';

export default function Footer() {
    return (
        <footer className="w-full border-t border-ed-rule bg-ed-bg px-6 pb-10 pt-16 text-ed-fg sm:px-8 lg:px-10">
            <div className="mx-auto max-w-[1440px]">
                <div className="grid gap-14 py-4 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                    <div className="space-y-7">
                        <Link href="/" className="group inline-flex min-h-11 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ed-rule bg-[#111111]">
                                <Image
                                    src="/submission-logo.png"
                                    alt="Submission Archives"
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="leading-none">
                                <p className="font-serif text-xl text-ed-fg">Submission</p>
                                <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-ed-fg-muted">
                                    Archives
                                </p>
                            </div>
                        </Link>

                        <p className="max-w-md text-[0.95rem] leading-7 text-ed-fg-muted">
                            Submission Archives preserves works related to Submission and the Messenger of the Covenant, Dr. Rashad Khalifa. Transcriptions may contain errors; verify passages against their original sources before citing them (17:36).
                        </p>

                        <div className="flex items-center gap-3">
                            <FooterIcon href="https://youtube.com/@submissionarchives" label="YouTube">
                                <Youtube className="h-4 w-4" />
                            </FooterIcon>
                            <FooterIcon href="https://discord.gg/submissionserver" label="Discord">
                                <MessageCircle className="h-4 w-4" />
                            </FooterIcon>
                        </div>
                    </div>

                    <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 lg:col-span-2">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-4">
                                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                    {section.title}
                                </h2>
                                <ul className="space-y-1">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            {link.href.startsWith('http') ? (
                                                <a href={link.href} target="_blank" rel="noopener noreferrer" className={sectionLinkClasses}>
                                                    {link.name}
                                                    <span className="sr-only"> (opens in new tab)</span>
                                                </a>
                                            ) : (
                                                <Link href={link.href} className={sectionLinkClasses}>{link.name}</Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-ed-rule pt-6 text-sm text-ed-fg-muted sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        <span>© 2026 Submission Archives</span>
                        <a href="https://wikisubmission.org/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={legalLinkClasses}>
                            Privacy<span className="sr-only"> (opens in new tab)</span>
                        </a>
                        <a href="https://wikisubmission.org/legal/terms-of-use" target="_blank" rel="noopener noreferrer" className={legalLinkClasses}>
                            Terms<span className="sr-only"> (opens in new tab)</span>
                        </a>
                    </div>
                    <span className="font-medium text-ed-accent">Preserving the proofs with clarity</span>
                </div>
            </div>
        </footer>
    );
}

function FooterIcon({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
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
