'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

import { getBookSpinePalette, PAGE_EDGE_GRADIENT } from './bookSpineStyle';

interface Book3DCoverProps {
    href: string;
    coverSrc: string | null;
    coverAlt: string;
    title: string;
    author?: string;
    spineColor: string;
    sizes: string;
}

const REST_TILT = { rotateY: -16, rotateX: 2 };
const HOVER_TILT = { rotateY: -34, rotateX: 3 };
const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 220, damping: 22 };
const NO_TRANSITION = { duration: 0 };

export function Book3DCover({ href, coverSrc, coverAlt, title, author, spineColor, sizes }: Book3DCoverProps) {
    const [isActive, setIsActive] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const { spineGradient, textColor } = getBookSpinePalette(spineColor);
    const tilt = !prefersReducedMotion && isActive ? HOVER_TILT : REST_TILT;
    const shadowActive = !prefersReducedMotion && isActive;

    return (
        <Link
            href={href}
            className="group flex flex-col gap-3"
            onPointerEnter={() => setIsActive(true)}
            onPointerLeave={() => setIsActive(false)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
        >
            <div className="relative aspect-[2/3] w-full [perspective:1200px]">
                <motion.div
                    className="relative h-full w-full [transform-style:preserve-3d]"
                    animate={tilt}
                    transition={prefersReducedMotion ? NO_TRANSITION : SPRING_TRANSITION}
                >
                    <div className="absolute inset-0 overflow-hidden rounded-md border border-ed-rule bg-ed-surface [transform:translateZ(7px)]">
                        {coverSrc ? (
                            <Image src={coverSrc} alt={coverAlt} fill className="object-cover" sizes={sizes} />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-ed-surface text-ed-fg-muted">
                                <span className="font-serif text-sm">No Cover</span>
                            </div>
                        )}
                    </div>

                    <div
                        className="absolute inset-y-0 left-0 w-[14px] origin-left [transform:rotateY(-90deg)]"
                        style={{ background: spineGradient }}
                    >
                        <span
                            className="absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap text-center font-mono text-[6px] uppercase tracking-wide [writing-mode:vertical-rl]"
                            style={{ color: textColor }}
                        >
                            {title}
                        </span>
                    </div>

                    <div
                        className="absolute inset-x-0 top-0 h-[14px] origin-top [transform:rotateX(90deg)]"
                        style={{ background: PAGE_EDGE_GRADIENT }}
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 h-[14px] origin-bottom [transform:rotateX(-90deg)]"
                        style={{ background: PAGE_EDGE_GRADIENT }}
                    />
                </motion.div>

                <motion.div
                    className="absolute inset-x-4 -bottom-2 h-3 rounded-full bg-black/30 blur-md"
                    animate={{ opacity: shadowActive ? 0.45 : 0.25, scale: shadowActive ? 1.08 : 1 }}
                    transition={prefersReducedMotion ? NO_TRANSITION : { duration: 0.3 }}
                />
            </div>

            <div>
                <h3 className="font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent line-clamp-2">
                    {title}
                </h3>
                {author && <p className="mt-1 text-xs text-ed-fg-muted">{author}</p>}
            </div>
        </Link>
    );
}
