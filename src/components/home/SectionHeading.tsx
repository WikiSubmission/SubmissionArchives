type SectionHeadingProps = {
    numeral: string;
    title: string;
    className?: string;
};

/**
 * Shared branch heading: gradient Roman numeral + serif title on a hairline,
 * with a short accent segment underscoring the rule. Used by ArchiveBranch,
 * VideoArchiveSection, and AudioArchiveSection (replacing their three
 * near-identical local copies).
 */
export function SectionHeading({ numeral, title, className = '' }: SectionHeadingProps) {
    return (
        <header className={`relative mt-8 ${className}`}>
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 border-b border-ed-rule pb-5">
                <span
                    aria-hidden="true"
                    className="bg-gradient-to-br from-ed-accent via-ed-accent to-ed-accent-soft bg-clip-text font-display text-6xl leading-[0.8] text-transparent sm:text-7xl"
                >
                    {numeral}
                </span>
                <h3 className="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-medium leading-[0.9] tracking-[-0.035em] text-ed-fg">
                    {title}
                </h3>
            </div>
            <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-[2px] w-24 bg-gradient-to-r from-ed-accent to-transparent"
            />
        </header>
    );
}
