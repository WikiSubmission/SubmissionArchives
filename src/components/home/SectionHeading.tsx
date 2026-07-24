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
        <header className={`relative mt-6 ${className}`}>
            <div className="flex flex-col items-start gap-3 border-b border-ed-rule pb-5">
                <span
                    className="inline-flex items-center rounded-full border border-ed-rule bg-ed-surface/60 px-3 py-1 font-mono text-[0.72rem] font-semibold tracking-wider text-ed-fg-muted backdrop-blur-md"
                >
                    SECTION {numeral}
                </span>
                <h3 className="font-sans text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[0.95] tracking-tight text-ed-fg">
                    {title}
                </h3>
            </div>
            <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-px w-32 bg-ed-fg"
            />
        </header>
    );
}
