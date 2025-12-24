'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DigitalRainProps {
    className?: string;
    color?: string; // Hex or rgba color for the characters
    speed?: number; // Speed factor (default 1)
    opacity?: number; // Overall opacity of the effect
    direction?: 'down' | 'up'; // Future proofing
    fadeColor?: string; // Color to fade trails to (usually background color)
    duration?: number; // Duration in ms before fading out completely (optional)
}

const DigitalRain: React.FC<DigitalRainProps> = ({
    className = "",
    color = "#10B981", // Default Emerald-500
    speed = 1,
    opacity = 0.2, // Default low opacity for background
    fadeColor = "rgba(0, 0, 0, 0.05)", // Default dark mode fade
    duration
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (duration) {
            const fadeStart = Math.max(0, duration - 1000); // Start fading 1s before end

            const fadeTimer = setTimeout(() => {
                setIsFading(true);
            }, fadeStart);

            const endTimer = setTimeout(() => {
                setVisible(false);
            }, duration);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(endTimer);
            };
        }
    }, [duration]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions
        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Configuration
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops: number[] = [];

        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100; // Start at random positions above visible area
        }

        const characters = "01"; // Binary rain

        let animationId: number;

        const draw = () => {
            // Fade out previous frame to create trails
            ctx.fillStyle = fadeColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = color;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Randomly skip drawing some frames for "glitchier" look or varying speeds
                if (Math.random() > 0.975) {
                    // flickering character
                }

                const text = characters.charAt(Math.floor(Math.random() * characters.length));

                // x = i * fontSize, y = value of drops[i] * fontSize
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillText(text, x, y);

                // Reset drop to top randomly after it crossed screen
                // Add randomness to reset so they don't all look like a curtain
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Increment y coordinate
                drops[i] += speed;
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
