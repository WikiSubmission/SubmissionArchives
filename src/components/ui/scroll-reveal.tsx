/**
 * Re-exported from components/home/Reveal — the scroll-triggered entrance
 * wrapper already used across the home page. Kept as a single
 * implementation rather than a second IntersectionObserver wrapper; this
 * file just gives it a stable, non-home-scoped import path for other pages.
 */
export { Reveal as ScrollReveal } from '@/components/home/Reveal';
