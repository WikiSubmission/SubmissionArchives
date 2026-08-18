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
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: 'spring',
                stiffness: 450,
                damping: 30,
            }}
            className={`group relative overflow-hidden rounded-[8px] border border-[#2A2928] bg-[#161514] p-5 sm:p-6 transition-all duration-[280ms] ease-out hover:border-[#353433] hover:bg-[#1C1B1A] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)] ${className}`}
        >
            {/* Dynamic Cursor Spotlight Radial Layer */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-[8px] transition-opacity duration-300 opacity-0 group-hover:opacity-100"
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
                            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200,121,74,0.08), transparent 70%)`,
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
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] rounded-[8px]"
            >
                {content}
            </Link>
        );
    }

    return content;
}
