type SectionHeadingProps = {
    numeral: string;
    title: string;
    className?: string;
};

/**
 * Shared branch heading: gradient Roman numeral + serif title on a hairline,
 * with a short accent segment underscoring the rule. Used by ArchiveBranch,
 * VideoArchiveSection, and AudioArchiveSection.
 */
export function SectionHeading({ numeral, title, className = '' }: SectionHeadingProps) {
    return (
        <header className={`relative mt-6 ${className}`}>
            <div className="flex flex-col items-start gap-3 border-b border-ed-rule-strong/80 pb-5">
                <span
                    className="inline-flex items-center rounded-full border border-ed-rule-strong bg-ed-surface-strong px-3.5 py-1 font-mono text-[0.72rem] font-bold tracking-wider text-ed-fg shadow-sm"
                >
                    SECTION {numeral}
                </span>
                <h3 className="font-slab text-[clamp(2.2rem,5.5vw,3.6rem)] font-black leading-[0.95] tracking-tight text-ed-fg">
                    {title}
                </h3>
            </div>
            <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-[2px] w-36 bg-ed-fg shadow-sm"
            />
        </header>
    );
}
