import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Preservation Principles — Submission Archives',
    description:
        'The archival methodology behind Submission Archives, and the terms under which its preserved material is offered.',
};

const LAST_UPDATED = 'August 18, 2026';

const SECTIONS = [
    { id: 'our-mission', label: 'Our Mission' },
    { id: 'verification-principle', label: 'The Verification Principle' },
    { id: 'archival-method', label: 'Archival Method' },
    { id: 'acceptable-use', label: 'Acceptable Use' },
    { id: 'no-warranty', label: 'No Warranty' },
    { id: 'external-links', label: 'External Links' },
    { id: 'changes', label: 'Changes to These Principles' },
    { id: 'contact', label: 'Contact' },
];

export default function PreservationPrinciplesPage() {
    return (
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]">
                        <Link href="/" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
                            Submission Archives
                        </Link>
                        <span className="text-[#353433]">/</span>
                        <span className="text-[#6B6560]">Preservation Principles</span>
                    </nav>

                    <header className="mb-10 max-w-[720px] border-b border-[#2A2928] pb-8">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                            <ShieldCheck className="h-3 w-3" />
                            Legal &amp; Methodology
                        </div>
                        <h1
                            className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB] sm:text-[40px]"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Preservation Principles
                        </h1>
                        <p
                            className="mt-3 text-[15px] leading-[1.6] text-[#9E9690]"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            The archival standards this project holds itself to, and the terms under which the
                            preserved material here is offered.
                        </p>
                        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#4A4542]">
                            Last updated: {LAST_UPDATED}
                        </p>
                    </header>

                    <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
                        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:h-fit">
                            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A4542]">
                                On This Page
                            </div>
                            <ul className="space-y-2 border-l border-[#2A2928] pl-4">
                                {SECTIONS.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="text-[13px] text-[#6B6560] transition-colors hover:text-[#C8794A]"
                                        >
                                            {section.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div
                            className="max-w-[68ch] space-y-10 text-[15px] leading-[1.7] text-[#9E9690] [&_a]:text-[#C8794A] [&_a]:transition-colors [&_a:hover]:text-[#D9916A] [&_h2]:mb-3.5 [&_h2]:mt-0 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-[#F5F0EB] [&_p]:mb-3.5 [&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            <section id="our-mission">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>Our Mission</h2>
                                <p>
                                    Submission Archives exists to keep historical audio recordings, video lectures,
                                    scripture translations, and written works related to Submission and Dr. Rashad
                                    Khalifa available, searchable, and intact for as long as this project can maintain
                                    it. It is a preservation effort, not a publisher — the material here is archived,
                                    not authored.
                                </p>
                                <p>
                                    Access is, and will remain, free and open. There are no accounts, no paywalls, and no
                                    registration required to read, watch, listen, or search.
                                </p>
                            </section>

                            <section id="verification-principle">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    The Verification Principle
                                </h2>
                                <div className="mb-3.5 rounded-[8px] border border-[#2A2928] bg-[#161514] p-4 text-[14px] text-[#9E9690]">
                                    <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F5F0EB]">
                                        Verification Principle (17:36)
                                    </span>
                                    Transcriptions and OCR copies may contain automated errors. Always verify citations
                                    directly against original audio recordings and printed facsimiles.
                                </div>
                                <p>
                                    Transcripts, OCR&rsquo;d text, and search indexes are generated tools meant to make
                                    the archive navigable — they are not a substitute for the original recording or
                                    scan. Where a transcript and a facsimile disagree, the facsimile is authoritative.
                                    This is the single most important principle behind how this archive should be used
                                    for research or citation.
                                </p>
                            </section>

                            <section id="archival-method">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Archival Method
                                </h2>
                                <ul>
                                    <li>
                                        <strong className="text-[#F5F0EB]">Source fidelity.</strong> Original
                                        recordings, scans, and publications are preserved as they exist historically,
                                        without editorial alteration.
                                    </li>
                                    <li>
                                        <strong className="text-[#F5F0EB]">Labeled derivatives.</strong> Any
                                        transcript, OCR pass, or generated thumbnail is clearly presented as a
                                        derivative of the original, never as a replacement for it.
                                    </li>
                                    <li>
                                        <strong className="text-[#F5F0EB]">Attribution.</strong> Source, speaker, and
                                        original date are credited wherever that information is available.
                                    </li>
                                    <li>
                                        <strong className="text-[#F5F0EB]">No doctrinal authority.</strong> This
                                        project preserves and indexes source material; it does not issue religious
                                        rulings or claim interpretive authority over it.
                                    </li>
                                </ul>
                            </section>

                            <section id="acceptable-use">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Acceptable Use
                                </h2>
                                <p>
                                    The archive is offered for personal research, study, and reference. You are welcome
                                    to read, watch, listen, quote, and cite what you find here. Please don&rsquo;t:
                                </p>
                                <ul>
                                    <li>
                                        Run automated bulk scraping or downloading against the site in a way that
                                        degrades its availability for other researchers.
                                    </li>
                                    <li>
                                        Misrepresent archived material as something other than what it is, or alter it
                                        and present the alteration as an original historical document.
                                    </li>
                                    <li>Use the search, playback, or any interactive feature to distribute unlawful content.</li>
                                </ul>
                                <p>
                                    Reasonable request rate limits are enforced automatically to keep the archive
                                    available to everyone.
                                </p>
                            </section>

                            <section id="no-warranty">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>No Warranty</h2>
                                <p>
                                    Archived material is provided as-is, for historical and educational reference.
                                    While care is taken in digitization and transcription, no guarantee is made that any
                                    transcript, OCR text, search result, or metadata field is complete or error-free —
                                    see the Verification Principle above. Submission Archives is not liable for
                                    decisions made in reliance on transcribed or automatically generated text without
                                    verifying it against the original source.
                                </p>
                            </section>

                            <section id="external-links">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    External Links
                                </h2>
                                <p>
                                    Some content is hosted on or links out to third-party platforms, including YouTube
                                    and Discord. Those platforms operate under their own terms and are outside this
                                    project&rsquo;s control.
                                </p>
                            </section>

                            <section id="changes">
                                <h2 style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    Changes to These Principles
                                </h2>
                                <p>
                                    If these principles change, the date at the top of this page will be updated to
                                    reflect it.
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
