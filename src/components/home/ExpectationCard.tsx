type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

/**
 * Capability row: mono index, serif title, muted body. On hover the row
 * gains a soft panel wash and the title slides to the accent — a small
 * reward for scanning the list.
 */
export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group -mx-3 grid grid-cols-[2.6rem_1fr] gap-3 rounded-none px-3 py-5 transition-colors duration-200 sm:py-6 hover:bg-ed-surface">
            <span
                className="pt-1 font-mono text-[0.68rem] font-semibold tabular-nums text-ed-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                aria-hidden="true"
            >
                {index ? `[${index}]` : '[•]'}
            </span>
            <div>
                <h4 className="font-display text-[1.05rem] font-medium leading-6 text-ed-fg transition-colors duration-200 group-hover:text-ed-accent">
                    {title}
                </h4>
                <p className="mt-2 text-[0.82rem] leading-6 text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}
