import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

const archivePhotos = [
    { src: '/images/archive-photos/M3.png', alt: 'Rashad Khalifa and the community standing in prayer', caption: 'Community prayer' },
    { src: '/images/archive-photos/M1.png', alt: 'Newspaper profile showing Rashad Khalifa with his computer and Quran', caption: 'Rashad Khalifa in the press' },
    { src: '/images/archive-photos/M2.png', alt: 'Rashad Khalifa seated with a group studying together', caption: 'A community study session' },
    { src: '/images/archive-photos/M4.jpeg', alt: 'Rashad Khalifa working at a computer in his office', caption: 'Rashad Khalifa at work' },
];

export function HeroSection() {
    return (
        <>
        <section className="archive-hero" aria-labelledby="hero-title">
            <div className="archive-hero-image" aria-hidden="true">
                <Image src="/images/hero/tucson-archive.webp" alt="" fill preload sizes="100vw" quality={85} className="archive-hero-art object-cover" />
            </div>
            <div className="archive-hero-wash" aria-hidden="true" />
            <div className="relative mx-auto flex min-h-[560px] max-w-[1160px] items-center px-5 py-16 sm:px-8 lg:min-h-[610px] lg:py-20">
                <div className="max-w-[560px]">
                    <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.17em] text-ed-accent">Recordings, scripture &amp; written works</p>
                    <h1 id="hero-title" className="font-serif text-[clamp(3.1rem,6.3vw,5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ed-fg">Submission<br /><span className="font-normal italic text-ed-accent">Archives.</span></h1>
                    <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ed-fg-secondary sm:text-[19px]" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>A reading room for the work of Dr. Rashad Khalifa. Explore original recordings, preserved publications, and scripture—open to study, compare, and verify.</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link href="/search" className="hero-primary-link"><Search size={16} aria-hidden />Search the archive</Link>
                        <Link href="/written" className="hero-secondary-link">Enter the reading room<ArrowRight size={16} aria-hidden /></Link>
                    </div>
                </div>
            </div>
            <div className="archive-hero-caption"><span>Tucson, Arizona</span><span className="hidden sm:inline">A legacy preserved for study</span></div>
        </section>
        <section className="hero-photo-strip" aria-labelledby="archive-photos-title">
            <div className="mx-auto max-w-[1160px] px-5 py-7 sm:px-8">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="archive-photos-title" className="font-serif text-lg text-ed-fg">From the photographic archive</h2>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-ed-fg-muted">Rashad Khalifa &amp; the community</span>
                </div>
                <div className="hero-photo-grid">
                    {archivePhotos.map((photo) => (
                        <figure key={photo.src} className="min-w-0">
                            <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`View original: ${photo.caption} (opens in a new tab)`} className="relative block aspect-[4/3] overflow-hidden bg-ed-surface transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ed-accent">
                                <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 45vw, 260px" className="object-contain" />
                            </a>
                            <figcaption className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ed-fg-muted">{photo.caption}<span aria-hidden>↗</span></figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
        </>
    );
}
