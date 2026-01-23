import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TopicCardProps {
    title: string;
    subtitle?: string;
    href: string;
}

export function TopicCard({ title, subtitle, href }: TopicCardProps) {
    return (
        <Link
            href={href}
            className="
        group relative block
        rounded-xl
        bg-zinc-950
        border border-zinc-800
        p-6
        transition
        hover:border-amber-500/50
      "
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="
            flex h-9 w-9 items-center justify-center
            rounded-md
            border border-amber-500/40
            text-amber-400
          ">
                        <Layers className="w-4 h-4" />
                    </div>

                    <span className="
            text-[10px] font-mono uppercase tracking-widest
            text-amber-400
          ">
                        Compiled Topic
                    </span>
                </div>

                <ArrowRight className="
          w-4 h-4 text-zinc-600
          opacity-0 translate-x-[-4px]
          group-hover:opacity-100
          group-hover:translate-x-0
          transition
        " />
            </div>

            {/* Title */}
            <h3 className="
        mt-4 text-lg font-semibold
        text-zinc-100
        leading-snug
      ">
                {title}
            </h3>

            {/* Subtitle */}
            {subtitle && (
                <p className="
          mt-1 text-sm
          text-zinc-400
        ">
                    {subtitle}
                </p>
            )}

            {/* Footer */}
            <div className="
        mt-6 pt-4
        border-t border-zinc-800
        flex items-center justify-between
        text-[11px] font-mono
        text-zinc-500
      ">
                <span>Evidence · Notes · References</span>
                <span className="text-amber-400">
                    View dossier →
                </span>
            </div>
        </Link>
    );
}
