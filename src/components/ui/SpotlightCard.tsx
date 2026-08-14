'use client';

import React, { useRef, useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

interface SpotlightCardProps {
    children: ReactNode;
    href?: string;
    className?: string;
    spotlightColor?: string;
    onClick?: () => void;
}

export function SpotlightCard({
    children,
    href,
    className = '',
    spotlightColor,
    onClick,
}: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const content = (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: 'spring',
                stiffness: 450,
                damping: 30,
            }}
            className={`group relative overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/60 dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] dark:border-white/[0.08] p-5 sm:p-6 transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface/90 dark:hover:border-white/20 dark:hover:from-white/[0.07] dark:hover:to-white/[0.02] shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] ${className}`}
        >
            {/* Dynamic Cursor Spotlight Radial Layer */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: spotlightColor
                        ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 70%)`
                        : undefined,
                }}
            >
                {!spotlightColor && (
                    <div
                        className="h-full w-full"
                        style={{
                            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, var(--ed-rule-strong), transparent 70%)`,
                        }}
                    />
                )}
            </div>

            {/* Inner Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent rounded-2xl"
            >
                {content}
            </Link>
        );
    }

    return content;
}
