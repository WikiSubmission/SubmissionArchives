type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group grid grid-cols-[2rem_1fr] gap-3 border-t border-ed-rule py-5 first:border-t-0 sm:first:border-t sm:py-6">
            <span className="pt-0.5 font-mono text-[0.66rem] font-semibold tabular-nums text-ed-accent" aria-hidden="true">
                {index ?? '•'}
            </span>
            <div>
                <h4 className="text-[0.94rem] font-semibold leading-6 text-ed-fg transition-colors group-hover:text-ed-accent">
                    {title}
                </h4>
                <p className="mt-2 text-[0.82rem] leading-6 text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}
