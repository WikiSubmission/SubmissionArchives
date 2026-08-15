import type { Variants } from 'motion/react';

export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
    animate: {
        transition: { staggerChildren: 0.05 },
    },
};

export const hoverLift = {
    y: -3,
    transition: { duration: 0.3 },
};
