import Link from 'next/link';
import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy — Submission Archives',
    description:
        'What Submission Archives collects, why, and what it never does — no accounts, no cookies, no tracking sold or shared.',
};

const LAST_UPDATED = 'August 18, 2026';

const SECTIONS = [
    { id: 'information-we-collect', label: 'Information We Collect' },
    { id: 'cookies', label: 'Cookies' },
    { id: 'local-storage', label: 'Local Storage' },
    { id: 'third-party-services', label: 'Third-Party Services' },
    { id: 'how-we-use-information', label: 'How We Use Information' },
    { id: 'data-retention', label: 'Data Retention' },
    { id: 'childrens-privacy', label: "Children's Privacy" },
    { id: 'your-choices', label: 'Your Choices' },
    { id: 'changes', label: 'Changes to This Policy' },
    { id: 'contact', label: 'Contact' },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-ed-fg-muted">
                        <Link href="/" className="text-ed-fg-muted transition-colors hover:text-ed-accent">
                            Submission Archives
                        </Link>
                        <span className="text-ed-fg-faint">/</span>
                        <span className="text-ed-fg-secondary">Privacy Policy</span>
                    </nav>

                    <header className="mb-10 max-w-[720px] border-b border-ed-rule pb-8">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                            <Lock className="h-3 w-3" />
                            Legal
                        </div>
                        <h1
                            className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg sm:text-[40px]"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Privacy Policy
                        </h1>
                        <p
                            className="mt-3 text-[15px] leading-[1.6] text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Submission Archives is a free, account-free digital preservation project. This page explains,
                            plainly, what little data the site touches and why.
                        </p>
                        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ed-fg-muted">
                            Last updated: {LAST_UPDATED}
                        </p>
                    </header>

                    <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
                        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:h-fit">
                            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                On This Page
                            </div>
                            <ul className="space-y-2 border-l border-ed-rule pl-4">
                                {SECTIONS.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="text-[13px] text-ed-fg-muted transition-colors hover:text-ed-accent"
                                        >
                                            {section.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div
                            className="max-w-[68ch] space-y-10 text-[15px] leading-[1.7] text-ed-fg-secondary [&_a]:text-ed-accent [&_a]:transition-colors [&_a:hover]:opacity-80 [&_h2]:mb-3.5 [&_h2]:mt-0 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-ed-fg [&_p]:mb-3.5 [&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            <section id="information-we-collect">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Information We Collect
                                </h2>
                                <p>
                                    There are no accounts on Submission Archives. Nothing is required to search, read,
                                    watch, or listen — the site never asks for your name, email address, or any other
                                    personal information.
                                </p>
                                <p>What the site does collect is limited to anonymous, aggregate diagnostics:</p>
                                <ul>
                                    <li>
                                        <strong className="text-ed-fg">Performance metrics.</strong> Standard web
                                        performance measurements (load speed, responsiveness) tied to the page path you
                                        visited — never the search terms or query parameters in the URL.
                                    </li>
                                    <li>
                                        <strong className="text-ed-fg">Error reports.</strong> If something breaks,
                                        the browser sends us the error message and the page path so we can fix it. Query
                                        strings are deliberately excluded, since they can contain what you searched for.
                                    </li>
                                    <li>
                                        <strong className="text-ed-fg">Anonymous search analytics.</strong> Query
                                        text, result counts, and which result was clicked — used only to improve search
                                        relevance. Nothing here is linked to you or your device.
                                    </li>
                                </ul>
                                <p>
                                    All of the above lands in our own server logs, not a database, and is never sold,
                                    shared, or used for advertising.
                                </p>
                            </section>

                            <section id="cookies">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>Cookies</h2>
                                <div className="mb-3.5 rounded-[8px] border border-ed-rule bg-ed-surface p-4 text-[14px] text-ed-fg-secondary shadow-sm">
                                    <strong className="text-ed-fg">Submission Archives does not set cookies.</strong>{' '}
                                    There is no cookie banner because there is nothing to consent to.
                                </div>
                                <p>
                                    The one exception is outside our control: pages that embed a YouTube video load
                                    YouTube&rsquo;s own player, which may set cookies under Google&rsquo;s policies once
                                    you choose to play it. See{' '}
                                    <a
                                        href="https://policies.google.com/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Google&rsquo;s Privacy Policy
                                    </a>{' '}
                                    for details.
                                </p>
                            </section>

                            <section id="local-storage">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>Local Storage</h2>
                                <p>
                                    A handful of preferences are remembered on your own device, using your
                                    browser&rsquo;s local storage. None of this ever leaves your browser:
                                </p>
                                <ul>
                                    <li>Light/dark theme choice</li>
                                    <li>PDF reader zoom, layout, and reading-theme preferences</li>
                                    <li>Your reading progress in a document, so you can resume where you left off</li>
                                    <li>Saved search filters</li>
                                    <li>Recent search history on the homepage demo, which expires automatically after 30 days</li>
                                </ul>
                                <p>
                                    You can clear any of this at any time through your browser&rsquo;s settings — it is
                                    stored only on your device, never on our servers.
                                </p>
                            </section>

                            <section id="third-party-services">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Third-Party Services
                                </h2>
                                <p>
                                    Some video and audio in the archive is hosted on YouTube and embedded here for
                                    playback; playing it is subject to YouTube and Google&rsquo;s own privacy practices,
                                    not ours. Links to our Discord server are plain outbound links — nothing is shared
                                    with Discord unless you click through and choose to join.
                                </p>
                                <p>
                                    All fonts on this site are self-hosted at build time, so visiting Submission Archives
                                    never triggers a request to a font provider.
                                </p>
                            </section>

                            <section id="how-we-use-information">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    How We Use Information
                                </h2>
                                <p>
                                    The diagnostics described above exist for one reason: keeping the archive fast,
                                    working, and easy to search. Nothing is used for advertising, profiling, or resale,
                                    and nothing is shared with third parties for marketing purposes.
                                </p>
                            </section>

                            <section id="data-retention">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Data Retention
                                </h2>
                                <p>
                                    There is no database of personal information to retain, because none is collected.
                                    Server logs are kept only as long as needed for operating and debugging the site. IP
                                    addresses are used transiently, in memory, purely to prevent abusive request volume
                                    — they are never written to a log or a database, and that in-memory record clears
                                    itself automatically.
                                </p>
                            </section>

                            <section id="childrens-privacy">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Children&rsquo;s Privacy
                                </h2>
                                <p>
                                    Submission Archives does not knowingly collect personal information from anyone,
                                    including children, because it does not collect personal information from anyone at
                                    all.
                                </p>
                            </section>

                            <section id="your-choices">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Your Choices
                                </h2>
                                <p>
                                    You can browse with local storage or scripts disabled and the archive will still
                                    function for reading and browsing, though preferences like theme and reading
                                    progress will no longer be remembered. Browser extensions that block third-party
                                    cookies will not affect anything on this site except embedded YouTube playback.
                                </p>
                            </section>

                            <section id="changes">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Changes to This Policy
                                </h2>
                                <p>
                                    If this policy changes, the date at the top of this page will be updated to reflect
                                    it.
                                </p>
                            </section>

                            <section id="contact">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>Contact</h2>
                                <p>
                                    Questions or comments about the Service may be directed to us at{' '}
                                    <a href="mailto:contact@wikisubmission.org">contact@wikisubmission.org</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
