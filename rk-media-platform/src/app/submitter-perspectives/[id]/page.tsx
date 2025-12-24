
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import NewsletterHeader from './NewsletterHeader';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
    const dir = path.join(process.cwd(), 'public/data/newsletters/html');
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    return files.map(f => ({ id: f.replace('.json', '') }));
}


function StructuredContent({ doc }: { doc: any }) {
    if (!doc) return null;

    // Helper to detect if text is a verse reference (contains Quran citation)
    const isVerseReference = (text: string) => {
        // Check for verse references like [44:9-15], (3:81), or (Quran 10:20)
        const hasReference = /\((?:Qur['’]?an\s+)?\d+:\d+(?:-\d+)?\)|\[(?:Qur['’]?an\s+)?\d+:\d+(?:-\d+)?\]/i.test(text);
        // Check if text ends with a reference (common pattern for verses)
        const endsWithReference = /\[\d+:\d+(-\d+)?\]\s*$/.test(text);
        return hasReference || endsWithReference;
    };

    // Helper to check if text is likely a Quran verse (long text with reference)
    const isLikelyVerse = (text: string) => {
        return isVerseReference(text) && text.length > 40;
    };

    // Helper to render a single section's content
    const renderSection = (section: any, idx: string | number) => (
        <section key={idx} className="space-y-6">
            {section.title && (
                <h2 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-3xl font-bold mt-12 mb-6 text-foreground tracking-tight">
                    {section.title}
                </h2>
            )}

            {section.content?.map((text: string, i: number) => {
                // Check if this looks like a verse quote
                if (isLikelyVerse(text)) {
                    return (
                        <div key={i} className="my-6 px-6 py-5 bg-slate-50 dark:bg-slate-900 border-l-4 border-slate-700 dark:border-slate-500 rounded-r-lg">
                            <p className="italic text-lg leading-relaxed text-slate-800 dark:text-slate-200">{text}</p>
                        </div>
                    );
                }
                return (
                    <p key={i} className="leading-relaxed text-base mb-4 text-foreground font-mono">{text}</p>
                );
            })}
            {section.image && (
                <div className="my-8 flex flex-col items-center">
                    <img
                        src={section.image.src}
                        alt={section.image.alt || ''}
                        className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                    {section.image.caption && (
                        <p className="text-center text-sm text-gray-500 mt-2 italic">
                            {section.image.caption}
                        </p>
                    )}
                </div>
            )}

            {section.quotes && (
                <div className="space-y-6 my-8 pl-6 border-l-4 border-amber-600 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 p-6 rounded-r-lg shadow-sm">
                    {section.quotes.map((quote: any, i: number) => (
                        <div key={i}>
                            <p className="italic text-xl mb-3 font-medium text-foreground leading-relaxed">"{quote.text}"</p>
                            {quote.reference && <cite className="block text-sm text-amber-600 dark:text-amber-400 not-italic font-semibold">— {quote.reference}</cite>}
                        </div>
                    ))}
                </div>
            )}

            {section.quote_block && (
                <div className="my-8 px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-l-4 border-slate-800 dark:border-slate-600 rounded-r-lg shadow-sm">
                    {Array.isArray(section.quote_block.text) ? (
                        section.quote_block.text.map((t: string, i: number) => (
                            <p key={i} style={{ fontFamily: 'var(--font-roboto-slab)' }} className="italic text-xl leading-relaxed text-foreground mb-4">{t}</p>
                        ))
                    ) : (
                        <p style={{ fontFamily: 'var(--font-roboto-slab)' }} className="italic text-xl leading-relaxed text-foreground mb-4">{section.quote_block.text}</p>
                    )}

                    {section.quote_block.reference && (
                        <div className="text-left font-bold text-slate-700 text-sm mt-4">
                            {section.quote_block.reference}
                        </div>
                    )}
                    {section.quote_block.references && (
                        <div className="text-left font-bold text-slate-700 text-sm mt-4">
                            {section.quote_block.references.join(', ')}
                        </div>
                    )}
                </div>
            )}

            {section.center_block && (
                <div className="my-8 bg-gray-50 dark:bg-zinc-900 p-8 rounded-lg text-center border border-gray-100 dark:border-zinc-800 shadow-sm">
                    {section.center_block.content?.map((text: string, i: number) => (
                        <p key={i} className="mb-4 font-medium text-lg">{text}</p>
                    ))}
                    {section.center_block.references && (
                        <div className="text-sm text-gray-500 mt-4 font-bold tracking-wider">
                            {section.center_block.references.join(' • ')}
                        </div>
                    )}
                </div>
            )}

            {section.right_block && (
                <div className="my-8 mr-auto max-w-lg bg-blue-50 dark:bg-blue-950/50 p-6 rounded-xl border border-blue-100 dark:border-blue-900 text-left">
                    {section.right_block.content?.map((text: string, i: number) => (
                        <p key={i} className="mb-4 text-blue-900 dark:text-blue-100">{text}</p>
                    ))}
                    {section.right_block.references && (
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-bold">
                            {section.right_block.references.join(' ')}
                        </div>
                    )}
                </div>
            )}

            {section.long_reflection && (
                <div className="my-10 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-zinc-900 p-8 rounded-xl shadow-inner border border-indigo-100 dark:border-indigo-900/50">
                    {section.long_reflection.map((text: string, i: number) => (
                        <p key={i} className={`mb-4 text-lg text-indigo-900 dark:text-indigo-100 ${i === 0 ? "font-bold text-xl mb-6" : ""}`}>{text}</p>
                    ))}
                </div>
            )}

            {section.table && (
                <div className="my-10 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                            <tr>
                                <th colSpan={3} className="px-6 py-3 text-center text-base font-bold tracking-wider">{section.table.title}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {section.table.rows.map((row: string[], i: number) => (
                                <tr key={i} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${i === 0 ? 'bg-gray-50 dark:bg-gray-800 font-bold' : 'bg-white dark:bg-gray-900'}`}>
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-6 py-4 text-gray-900 dark:text-gray-100 text-center align-top">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {section.editorial_note && (
                <div className="my-6 text-center italic text-gray-500 font-serif text-lg">
                    — {section.editorial_note.text || section.editorial_note} —
                </div>
            )}

            {section.coming_next && (
                <div className="my-8 p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <h4 className="font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest text-sm">Coming Next Issue</h4>
                    <div className="flex flex-wrap justify-center gap-4 font-bold text-gray-800 dark:text-gray-200">
                        {section.coming_next.map((item: string, i: number) => (
                            <span key={i} className="flex items-center gap-2">
                                {i > 0 && <span className="text-gray-300 dark:text-gray-700">•</span>}
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {section.section_divider && (
                <div className="text-center text-gray-300 my-12 text-xl tracking-[0.5em] select-none opacity-50">
                    • • •
                </div>
            )}

            {section.footer_sections && (
                <div className="grid md:grid-cols-2 gap-8 mt-12 bg-gray-50 dark:bg-zinc-900 p-8 rounded-xl">
                    {section.footer_sections.map((fs: any, i: number) => (
                        <div key={i}>
                            <h3 className="font-bold uppercase text-foreground mb-4 border-b border-border pb-2">{fs.title}</h3>
                            {fs.items ? (
                                <ul className="space-y-2">
                                    {fs.items.map((item: string, j: number) => (
                                        <li key={j} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="font-bold text-amber-600 dark:text-amber-500 text-lg">{fs.text}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {section.footer && Array.isArray(section.footer) && (
                <div className="mt-12 space-y-4 text-center border-t border-gray-100 pt-8">
                    {section.footer.map((block: string, i: number) => (
                        <p key={i} className="font-bold text-gray-600 text-sm uppercase tracking-wide">{block}</p>
                    ))}
                </div>
            )}

            {section.footer_blocks && (
                <div className="mt-12 space-y-4 text-center border-t border-gray-100 pt-8">
                    {section.footer_blocks.map((block: string, i: number) => (
                        <p key={i} className="font-bold text-gray-600 text-sm uppercase tracking-wide">{block}</p>
                    ))}
                </div>
            )}
        </section>
    );

    return (
        <div className="newsletter-wrapper">
            {/* Header - Centered and Wide */}
            {doc.header && (
                <header className="mb-12 border-2 border-border p-6 md:p-8 bg-card max-w-5xl mx-auto shadow-sm">
                    {/* Basmalah Section */}
                    <div className="text-center space-y-3 mb-8">
                        <div className="font-arabic text-4xl md:text-5xl leading-relaxed" dir="rtl">
                            {doc.header.basmala_arabic || "بسم الله الرحمن الرحيم"}
                        </div>
                        <div style={{ fontFamily: 'var(--font-roboto-slab)' }} className="italic text-xl md:text-2xl font-bold text-foreground">
                            {doc.header.basmala_english}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-6xl md:text-8xl font-bold text-center mb-6 text-foreground tracking-tight leading-none">
                        {doc.header.title}
                    </h1>

                    {/* Subtitle Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6 mb-8 font-mono text-sm md:text-base border-b-0 uppercase tracking-wide">
                        <div className="flex-1 md:text-left font-bold text-muted-foreground">
                            {doc.header.subtitle}
                        </div>
                        <div className="text-3xl font-bold tracking-widest px-4 hidden md:block">
                            ***
                        </div>
                        <div className="flex-1 md:text-right font-medium">
                            {doc.header.tagline || "Proclaiming the only religion acceptable to God"}
                        </div>
                    </div>

                    {/* Info Row: Date and Issue No */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-end mb-2 font-bold text-xl md:text-2xl font-mono uppercase tracking-wider">
                        <div className="text-center md:text-left order-2 md:order-1 text-muted-foreground">
                            {doc.header.date}
                        </div>
                        <div className="text-center order-1 md:order-2 mb-4 md:mb-0">
                            <span style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-foreground text-3xl">
                                [{doc.header.issue_no && !doc.header.issue_no.includes('No') ? `No ${doc.header.issue_no}` : doc.header.issue_no}]
                            </span>
                        </div>
                        <div className="text-center md:text-right order-3">
                            {/* Placeholder for balance if needed */}
                        </div>
                    </div>

                    {/* Editor */}
                    <div style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-center text-2xl md:text-3xl mt-6 pt-2">
                        Editor: {doc.header.editor}
                    </div>
                </header>
            )}

            <article className="newsletter-content max-w-3xl mx-auto px-4 sm:px-0">
                {/* Sections (Supports both 'pages' and flat 'sections') */}
                <div className="space-y-12">
                    {doc.pages ? (
                        doc.pages.map((page: any, pIdx: number) => (
                            <div key={pIdx} className="page-group mb-20">
                                {/* Optional Page Header */}
                                {page.header && pIdx > 0 && (
                                    <div className="text-center mb-8 border-b border-gray-100 pb-4">
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{page.page}</div>
                                        <div className="font-bold text-gray-800">{page.header.publisher}</div>
                                    </div>
                                )}

                                {page.sections.map((section: any, sIdx: number) => renderSection(section, `${pIdx}-${sIdx}`))}

                                {/* Page Divider */}
                                {pIdx < doc.pages.length - 1 && (
                                    <div className="flex items-center gap-4 my-16 opacity-30">
                                        <div className="h-px bg-gray-400 flex-1"></div>
                                        <div style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-sm italic text-gray-500">Page Break</div>
                                        <div className="h-px bg-gray-400 flex-1"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        doc.sections?.map((section: any, idx: number) => renderSection(section, idx))
                    )}
                </div>

                {/* Footer */}
                {doc.header && (doc.header.publisher === "MASJID TUCSON" || doc.header.pdf_link) && (
                    <footer className="mt-20 pt-12 border-t border-gray-200 text-center">
                        {doc.header.pdf_link && (
                            <div className="mb-8">
                                <a
                                    href={doc.header.pdf_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    View Original PDF
                                </a>
                            </div>
                        )}
                        <div className="font-bold text-xl mb-2">MASJID TUCSON</div>
                        <div className="font-arabic text-2xl mb-2">مسجد توسن</div>
                        <div className="text-gray-600">739 E. 8th St., Tucson, AZ 85719</div>
                    </footer>
                )}
            </article>
        </div>
    );
}

export default async function NewsletterReader({ params }: Props) {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public/data/newsletters/html', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        notFound();
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const title = `Submitter Perspectives ${content.month.toUpperCase()} ${content.year}`;
    const structuredDoc = content.document;

    // Load and sort metadata to determine Next/Prev
    const metadataPath = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
    let prevNewsletter = null;
    let nextNewsletter = null;

    if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        // Sort by fullDate ascending (Oldest -> Newest)
        // So "Next" means next chronological month (1985-05 -> 1985-06)
        const sorted = metadata.sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate));

        const currentIndex = sorted.findIndex((n: any) => n.id === id);
        if (currentIndex !== -1) {
            prevNewsletter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
            nextNewsletter = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
        }
    }

    return (
        <div className="min-h-screen bg-background pb-20 transition-colors duration-200">
            <NewsletterHeader
                title={title}
                pdfLink={structuredDoc?.header?.pdf_link}
                prevLink={prevNewsletter ? `/submitter-perspectives/${prevNewsletter.filename}` : undefined}
                nextLink={nextNewsletter ? `/submitter-perspectives/${nextNewsletter.filename}` : undefined}
                prevDate={prevNewsletter?.date}
                nextDate={nextNewsletter?.date}
            />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Global Styles for Legacy Content */}
                {!structuredDoc && (
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600&display=swap');

                        /* Base Styles */
                        .newsletter-content {
                            font-family: var(--font-mono), monospace;
                            font-size: 1.0rem; 
                            line-height: 1.7; 
                            color: var(--foreground); 
                            background-color: var(--background);
                            max-width: 65ch; 
                            margin: 0 auto;
                        }

                        /* CRITICAL: FLATTEN TABLES INTO SINGLE COLUMN */
                        .newsletter-content table, 
                        .newsletter-content tbody, 
                        .newsletter-content tr, 
                        .newsletter-content td,
                        .newsletter-content th { 
                            display: block !important; 
                            width: 100% !important; 
                            box-sizing: border-box !important;
                            float: none !important;
                            clear: both !important;
                            height: auto !important;
                        }

                        /* Text Normalization (No Caps) */
                        .newsletter-content span, 
                        .newsletter-content font {
                            font-variant: normal !important;
                            font-variant-caps: normal !important;
                            text-transform: none !important;
                            font-size: inherit !important;
                            font-family: inherit !important;
                            color: inherit !important;
                        }
                        
                        /* Compact Spacing */
                        .newsletter-content p {
                            margin-bottom: 1em; 
                        }
                        
                        .newsletter-content td { 
                            padding: 0;
                            margin-bottom: 0.5em; 
                        }

                        /* Headings */
                        .newsletter-content h1, .newsletter-content h2, .newsletter-content h3 {
                            font-family: var(--font-roboto-slab), serif;
                            color: var(--foreground); 
                            margin-top: 1.5em; 
                            margin-bottom: 0.5em;
                            line-height: 1.2;
                            font-weight: 700;
                            text-align: left;
                            text-transform: none !important; 
                        }
                        
                        .newsletter-content h1 { 
                            font-size: 2.25rem; 
                            text-align: center; 
                            margin-bottom: 1em;
                            padding-bottom: 0.5em;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        
                        .newsletter-content h2 { 
                            font-size: 1.5rem; 
                            margin-top: 2em; 
                            border-bottom: none;
                        }
                        
                        .newsletter-content h3 { font-size: 1.25rem; }

                        /* Hide formatting artifacts */
                        hr { display: none; }
                        .newsletter-content p:empty { display: none; }
                        .newsletter-content br { display: none; } 

                        /* Images */
                        .newsletter-content img { 
                            max-width: 100%; 
                            height: auto; 
                            display: block; 
                            margin: 2em auto; 
                            border-radius: 8px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        }
                        
                        /* Links */
                        .newsletter-content a { 
                            color: #d97706; 
                            text-decoration: underline; 
                            text-decoration-thickness: 1px;
                            text-underline-offset: 3px;
                        }
                        
                        /* Utility cleanups */
                        #containerborder { border: none !important; margin: 0 !important; }
                        .volume { display: none; }
                        
                        /* Fix centered text */
                        .newsletter-content div[align="center"], 
                        .newsletter-content p[align="center"] {
                            text-align: left !important;
                        }
                        
                        /* Merged Pages: No cards */
                        .newsletter-page { 
                            background: transparent; 
                            padding: 0; 
                            margin-bottom: 0; 
                            box-shadow: none; 
                            border-radius: 0;
                        }
                        
                        /* Hide legacy artifacts */
                        .newsletter-page table a[href*="page"] { display: none; }
                    `}} />
                )}

                {structuredDoc ? (
                    <StructuredContent doc={structuredDoc} />
                ) : (
                    <div
                        className="newsletter-content font-serif text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content.html }}
                    />
                )}
            </main>
        </div>
    );
}
