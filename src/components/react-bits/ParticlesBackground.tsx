'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    baseAlpha: number;
    alpha: number;
    color: string;
    pulseSpeed: number;
    angle: number;
}

interface ReactBitsParticlesProps {
    particleCount?: number;
    speed?: number;
    particleColors?: string[];
    moveParticlesOnHover?: boolean;
    particleHoverFactor?: number;
    particleBaseSize?: number;
    sizeRandomness?: number;
    className?: string;
}

const defaultColors = ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'];

export function ReactBitsParticles({
    particleCount = 70,
    speed = 0.5,
    particleColors = defaultColors,
    moveParticlesOnHover = true,
    particleHoverFactor = 1.2,
    particleBaseSize = 2,
    sizeRandomness = 1.5,
    className,
}: ReactBitsParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
        x: -1000,
        y: -1000,
        active: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

        const handleResize = () => {
            if (!canvas || !canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        // Initialize particle array
        const particles: Particle[] = Array.from({ length: particleCount }, () => {
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * speed * 0.8,
                vy: (Math.random() - 0.5) * speed * 0.8,
                size: Math.max(1, particleBaseSize + (Math.random() - 0.5) * sizeRandomness * 2),
                baseAlpha: 0.15 + Math.random() * 0.45,
                alpha: 0.15 + Math.random() * 0.45,
                color,
                pulseSpeed: 0.01 + Math.random() * 0.02,
                angle: Math.random() * Math.PI * 2,
            };
        });

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000, active: false };
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        // Render loop
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Connect nearby particles with delicate glowing golden threads
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 110) {
                        const lineAlpha = (1 - dist / 110) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(251, 191, 36, ${lineAlpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            // Update & draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Pulse alpha effect
                p.angle += p.pulseSpeed;
                p.alpha = p.baseAlpha + Math.sin(p.angle) * 0.15;

                // Mouse interaction / repulsion
                if (moveParticlesOnHover && mouseRef.current.active) {
                    const mDx = mouseRef.current.x - p.x;
                    const mDy = mouseRef.current.y - p.y;
                    const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
                    const maxDist = 130;

                    if (mDist < maxDist) {
                        const force = (1 - mDist / maxDist) * particleHoverFactor * 1.5;
                        p.x -= (mDx / mDist) * force;
                        p.y -= (mDy / mDist) * force;
                    }
                }

                // Position update
                p.x += p.vx;
                p.y += p.vy;

                // Boundary bounce
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Draw particle glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [particleCount, speed, particleColors, moveParticlesOnHover, particleHoverFactor, particleBaseSize, sizeRandomness]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('pointer-events-none absolute inset-0 h-full w-full opacity-70 transition-opacity duration-700', className)}
            aria-hidden="true"
        />
    );
}
