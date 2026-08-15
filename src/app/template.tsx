'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Runs inside RootLayout and re-mounts on every navigation (unlike
 * layout.tsx), so it's the hook point for a page-level fade transition.
 * Kept intentionally short: this is wayfinding, not a feature.
 */
export default function Template({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
