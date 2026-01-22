'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DigitalRainProps {
    className?: string;
    color?: string;
    speed?: number;
    opacity?: number;
    direction?: 'down' | 'up';
    fadeColor?: string;
    duration?: number;
}

const DigitalRain: React.FC<DigitalRainProps> = ({
    className = "",
    color = "#10B981",
    speed = 1,
    opacity = 0.3,
    fadeColor = "rgba(0, 0, 0, 0.05)",
    duration
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (duration) {
            const fadeStart = Math.max(0, duration - 1000);
            const fadeTimer = setTimeout(() => setIsFading(true), fadeStart);
            const endTimer = setTimeout(() => setVisible(false), duration);
            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(endTimer);
            };
        }
    }, [duration]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Enhanced configuration
        const fontSize = 16; // Slightly larger for visibility
        const columns = Math.floor(canvas.width / fontSize);

        // Drop state tracking
        interface Drop {
            y: number;
            speed: number;
            brightness: number;
        }

        const drops: Drop[] = [];

        // Initialize with varied properties
        for (let i = 0; i < columns; i++) {
            drops[i] = {
                y: Math.random() * -canvas.height,
                speed: 0.5 + Math.random() * 1.5, // Varied speeds
                brightness: 0.3 + Math.random() * 0.7 // Varied brightness
            };
        }

        // Binary only
        const characters = "01";

        let animationId: number;

        const draw = () => {
            // Semi-transparent black for trailing effect
            ctx.fillStyle = fadeColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw each column
            for (let i = 0; i < drops.length; i++) {
                const drop = drops[i];

                // Random character
                const char = characters.charAt(Math.floor(Math.random() * characters.length));
                const x = i * fontSize;
                const y = drop.y * fontSize;

                // Leading character (brightest)
                if (y > 0 && y < canvas.height) {
                    // Glow effect for leading char
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = color;

                    // Convert hex to rgba with brightness
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${drop.brightness})`;
                    ctx.font = `bold ${fontSize}px monospace`;
                    ctx.fillText(char, x, y);

                    // Trail characters (dimmer)
                    for (let j = 1; j < 8; j++) {
                        const trailY = y - j * fontSize;
                        if (trailY > 0) {
                            const trailOpacity = drop.brightness * (1 - j / 8);
                            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailOpacity})`;
                            ctx.shadowBlur = 5;
                            ctx.font = `${fontSize}px monospace`;
                            ctx.fillText(
                                characters.charAt(Math.floor(Math.random() * characters.length)),
                                x,
                                trailY
                            );
                        }
                    }

                    // Reset shadow
                    ctx.shadowBlur = 0;
                }

                // Move drop
                drop.y += drop.speed * speed;

                // Reset when off screen
                if (drop.y * fontSize > canvas.height + 100) {
                    drop.y = Math.random() * -10;
                    drop.speed = 0.5 + Math.random() * 1.5;
                    drop.brightness = 0.3 + Math.random() * 0.7;
                }

                // Occasional random repositioning for variety
                if (Math.random() > 0.998) {
                    drop.y = Math.random() * -50;
                }
            }

            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [color, speed, fadeColor]);

    if (!visible) return null;

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${className}`}
            style={{
                opacity: isFading ? 0 : opacity
            }}
        />
    );
};

export default DigitalRain;
