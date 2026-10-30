import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

// Order and count must match the staggered delays in site-chrome.css.
const heroPhotos = [
    { src: '/images/archive-photos/M3.png', position: 'center 40%' },
    { src: '/images/archive-photos/M1.png', position: 'center 30%' },
    { src: '/images/archive-photos/M2.png', position: 'center 35%' },
    { src: '/images/archive-photos/M4.jpeg', position: 'center 45%' },
];

export function HeroSection() {
    return (
        <section className="archive-hero" aria-labelledby="hero-title">
            <div className="archive-hero-image" aria-hidden="true">
                {heroPhotos.map((photo, index) => (
                    <Image key={photo.src} src={photo.src} alt="" fill preload={index === 0} sizes="100vw" quality={85} className="archive-hero-art object-cover" style={{ objectPosition: photo.position }} />
                ))}
            </div>
            <div className="archive-hero-wash" aria-hidden="true" />
            <div className="relative mx-auto flex min-h-[560px] max-w-[1160px] items-center px-5 py-16 sm:px-8 lg:min-h-[610px] lg:py-20">
                <div className="max-w-[560px]">
                    <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.17em] text-ed-accent">Recordings &amp; written works</p>
                    <h1 id="hero-title" className="font-serif text-[clamp(3.1rem,6.3vw,5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ed-fg">Submission<br /><span className="font-normal italic text-ed-accent">Archives.</span></h1>
                    <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.65] text-ed-fg-secondary sm:text-[19px]" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>A reading room for the work of Dr. Rashad Khalifa. Explore original recordings and preserved publications, open to study, compare, and verify.</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link href="/search" className="hero-primary-link"><Search size={16} aria-hidden />Search the archive</Link>
                        <Link href="/written" className="hero-secondary-link">Enter the reading room<ArrowRight size={16} aria-hidden /></Link>
                    </div>
                </div>
            </div>
            <div className="archive-hero-caption"><span>Tucson, Arizona</span><span className="hidden sm:inline">A legacy preserved for study</span></div>
        </section>
    );
}
