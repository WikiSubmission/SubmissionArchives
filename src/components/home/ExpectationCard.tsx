type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group rounded-xl border border-ed-rule/60 bg-ed-surface/30 p-4 sm:p-5 transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface/70 hover:shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span
                    className="inline-flex items-center rounded-full border border-ed-rule bg-ed-surface/60 px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold text-ed-fg-muted transition-colors group-hover:border-ed-fg-muted/40 group-hover:text-ed-fg"
                    aria-hidden="true"
                >
                    {index ? index : '•'}
                </span>
                <h4 className="font-sans text-[0.98rem] font-semibold leading-snug text-ed-fg">
                    {title}
                </h4>
            </div>
            <p className="mt-2.5 text-[0.84rem] leading-6 text-ed-fg-muted">
                {body}
            </p>
        </div>
    );
}
