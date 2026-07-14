import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div>
            <Link
                href={href}
                className="archive-button archive-button-primary w-full px-6 py-4"
            >
                {label}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
