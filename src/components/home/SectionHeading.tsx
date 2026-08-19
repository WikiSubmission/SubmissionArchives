type SectionHeadingProps = {
    numeral?: string;
    title: string;
    className?: string;
};

/**
 * Shared branch heading: clean serif title matching The Audio Archives style on a warm hairline.
 * Used by ArchiveBranch, VideoArchiveSection, and AudioArchiveSection.
 */
export function SectionHeading({ title, className = '' }: SectionHeadingProps) {
    return (
        <header className={`relative ${className}`}>
            <div className="flex flex-col items-start border-b border-[#2A2928] pb-4">
                <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]">
                    {title}
                </h2>
            </div>
            <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-[2px] w-20 bg-[#C8794A]"
            />
        </header>
    );
}


