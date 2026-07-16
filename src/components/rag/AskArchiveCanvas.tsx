'use client';

import { useEffect, useRef } from 'react';
import type { AskAtmosphereMode } from './askUiTypes';

interface AskArchiveCanvasProps {
    mode: AskAtmosphereMode;
    sourceCount: number;
}

interface EvidenceNode {
    baseX: number;
    baseY: number;
    x: number;
    y: number;
    phase: number;
    speed: number;
    label: string;
    kind: 'citation' | 'page' | 'time' | 'verse';
}

const NODE_LABELS = [
    'S1',
    'S2',
    'S3',
    'S4',
    'p. 42',
    'p. 117',
    '07:01',
    '12:48',
    '17:36',
    'Q 2:62',
    'Q 39:45',
    'Q 74:30',
    'Appendix',
    'Transcript',
    'Archive',
] as const;

function seededRandom(seed: number) {
    let value = seed >>> 0;
    return () => {
        value += 0x6d2b79f5;
        let next = value;
        next = Math.imul(next ^ (next >>> 15), next | 1);
        next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
        return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
}

function createNodes(count: number): EvidenceNode[] {
    const random = seededRandom(190674);
    return Array.from({ length: count }, (_, index) => {
        const label = NODE_LABELS[index % NODE_LABELS.length];
        const kind: EvidenceNode['kind'] =
            label.startsWith('S')
                ? 'citation'
                : label.startsWith('p.')
                  ? 'page'
                  : label.includes(':') && !label.startsWith('Q')
                    ? 'time'
                    : 'verse';

        return {
            baseX: 0.06 + random() * 0.88,
            baseY: 0.05 + random() * 0.82,
            x: 0,
            y: 0,
            phase: random() * Math.PI * 2,
            speed: 0.2 + random() * 0.42,
            label,
            kind,
        };
    });
}

function getModeAlpha(mode: AskAtmosphereMode): number {
    switch (mode) {
        case 'idle':
            return 0.34;
        case 'retrieving':
            return 0.56;
        case 'synthesizing':
            return 0.44;
        case 'revealing':
            return 0.22;
        case 'settled':
            return 0.1;
        case 'error':
            return 0.08;
    }
}

function getModePull(mode: AskAtmosphereMode): number {
    switch (mode) {
        case 'retrieving':
            return 0.46;
        case 'synthesizing':
            return 0.68;
        case 'revealing':
            return 0.34;
        default:
            return 0;
    }
}

export default function AskArchiveCanvas({ mode, sourceCount }: AskArchiveCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modeRef = useRef(mode);
    const sourceCountRef = useRef(sourceCount);

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        sourceCountRef.current = sourceCount;
    }, [sourceCount]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const host = canvas?.parentElement;
        if (!canvas || !host) return;

        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return;

        return setupAnimation(canvas, host, context, modeRef, sourceCountRef);
    }, []);

    return <canvas ref={canvasRef} aria-hidden="true" />;
}

function setupAnimation(
    canvas: HTMLCanvasElement,
    host: HTMLElement,
    context: CanvasRenderingContext2D,
    modeRef: { current: AskAtmosphereMode },
    sourceCountRef: { current: number },
): () => void {
    {
        const nodes = createNodes(38);
        const pointer = {
            targetX: 0.5,
            targetY: 0.36,
            currentX: 0.5,
            currentY: 0.36,
            active: false,
        };

        let cssWidth = 1;
        let cssHeight = 1;
        let animationFrame = 0;
        let lastFrame = 0;
        let inView = true;
        let documentVisible = document.visibilityState === 'visible';
        let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(pointer: fine)').matches;

        const computed = getComputedStyle(host);
        const accent = computed.getPropertyValue('--ed-accent').trim() || '#a95b32';
        const foregroundMuted = computed.getPropertyValue('--ed-fg-muted').trim() || '#6f6258';

        function resize() {
            const rect = host.getBoundingClientRect();
            cssWidth = Math.max(1, rect.width);
            cssHeight = Math.max(1, rect.height);

            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            for (const node of nodes) {
                if (node.x === 0 && node.y === 0) {
                    node.x = node.baseX * cssWidth;
                    node.y = node.baseY * cssHeight;
                }
            }
        }

        function draw(now: number) {
            context.clearRect(0, 0, cssWidth, cssHeight);

            const activeMode = modeRef.current;
            const baseAlpha = getModeAlpha(activeMode);
            const pull = getModePull(activeMode);
            const seconds = now / 1000;

            pointer.currentX += (pointer.targetX - pointer.currentX) * 0.075;
            pointer.currentY += (pointer.targetY - pointer.currentY) * 0.075;

            const pointerX = pointer.currentX * cssWidth;
            const pointerY = pointer.currentY * cssHeight;

            if (pointer.active && finePointer && activeMode !== 'settled') {
                const halo = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 250);
                halo.addColorStop(0, accent);
                halo.addColorStop(1, 'transparent');
                context.save();
                context.globalAlpha = activeMode === 'idle' ? 0.055 : 0.035;
                context.fillStyle = halo;
                context.fillRect(0, 0, cssWidth, cssHeight);
                context.restore();
            }

            const highlightedCount = Math.min(
                nodes.length,
                Math.max(sourceCountRef.current, activeMode === 'retrieving' ? 5 : 3),
            );

            const positions = nodes.map((node, index) => {
                const driftX = Math.sin(seconds * node.speed + node.phase) * 13;
                const driftY = Math.cos(seconds * node.speed * 0.83 + node.phase) * 9;

                const baseTargetX = node.baseX * cssWidth + driftX;
                const baseTargetY = node.baseY * cssHeight + driftY;

                const ringAngle = (index / nodes.length) * Math.PI * 2 + seconds * 0.06;
                const ringRadiusX = Math.min(cssWidth * 0.27, 280);
                const ringRadiusY = Math.min(cssHeight * 0.19, 165);
                const gatheredX = cssWidth * 0.5 + Math.cos(ringAngle) * ringRadiusX;
                const gatheredY = cssHeight * 0.38 + Math.sin(ringAngle) * ringRadiusY;

                const targetX = baseTargetX * (1 - pull) + gatheredX * pull;
                const targetY = baseTargetY * (1 - pull) + gatheredY * pull;

                node.x += (targetX - node.x) * (reducedMotion ? 1 : 0.045);
                node.y += (targetY - node.y) * (reducedMotion ? 1 : 0.045);

                return { x: node.x, y: node.y };
            });

            if (activeMode === 'retrieving' || activeMode === 'synthesizing') {
                context.save();
                context.strokeStyle = accent;
                context.lineWidth = 0.7;

                for (let index = 0; index < highlightedCount; index += 1) {
                    for (let next = index + 1; next < highlightedCount; next += 1) {
                        const a = positions[index];
                        const b = positions[next];
                        const distance = Math.hypot(a.x - b.x, a.y - b.y);
                        if (distance > 260) continue;

                        context.globalAlpha =
                            (1 - distance / 260) *
                            (activeMode === 'retrieving' ? 0.16 : 0.1);
                        context.beginPath();
                        context.moveTo(a.x, a.y);
                        context.lineTo(b.x, b.y);
                        context.stroke();
                    }
                }

                context.restore();
            }

            nodes.forEach((node, index) => {
                const position = positions[index];
                const distanceToPointer = Math.hypot(
                    position.x - pointerX,
                    position.y - pointerY,
                );
                const pointerInfluence =
                    pointer.active && finePointer
                        ? Math.max(0, 1 - distanceToPointer / 240)
                        : 0;

                const isHighlighted = index < highlightedCount;
                const alpha =
                    baseAlpha *
                    (isHighlighted ? 1.22 : 0.72) *
                    (1 + pointerInfluence * 1.55);

                context.save();
                context.globalAlpha = Math.min(alpha, 0.82);
                context.fillStyle = isHighlighted ? accent : foregroundMuted;

                context.beginPath();
                context.arc(position.x, position.y, isHighlighted ? 2.2 : 1.45, 0, Math.PI * 2);
                context.fill();

                context.font =
                    node.kind === 'citation'
                        ? '700 11px ui-monospace, SFMono-Regular, Menlo, monospace'
                        : '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
                context.textBaseline = 'middle';
                context.fillText(node.label, position.x + 7, position.y);
                context.restore();
            });
        }

        function frame(now: number) {
            animationFrame = 0;
            if (!inView || !documentVisible) return;

            if (reducedMotion) {
                draw(now);
                return;
            }

            if (now - lastFrame >= 1000 / 26) {
                draw(now);
                lastFrame = now;
            }

            animationFrame = window.requestAnimationFrame(frame);
        }

        function start() {
            if (animationFrame || !inView || !documentVisible) return;
            animationFrame = window.requestAnimationFrame(frame);
        }

        function stop() {
            if (!animationFrame) return;
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        }

        function handlePointerMove(event: PointerEvent) {
            if (!finePointer) return;
            const rect = host.getBoundingClientRect();
            const within =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;

            pointer.active = within;
            if (!within) return;

            pointer.targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
            pointer.targetY = (event.clientY - rect.top) / Math.max(rect.height, 1);
        }

        function handlePointerLeave() {
            pointer.active = false;
        }

        function handleVisibilityChange() {
            documentVisible = document.visibilityState === 'visible';
            if (documentVisible) start();
            else stop();
        }

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleReducedMotionChange = () => {
            reducedMotion = reducedMotionQuery.matches;
            stop();
            draw(performance.now());
            if (!reducedMotion) start();
        };

        const resizeObserver = new ResizeObserver(() => {
            resize();
            draw(performance.now());
        });
        resizeObserver.observe(host);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                inView = entry.isIntersecting;
                if (inView) start();
                else stop();
            },
            { rootMargin: '160px 0px', threshold: 0.01 },
        );
        intersectionObserver.observe(host);

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('blur', handlePointerLeave);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

        resize();
        draw(performance.now());
        start();

        return () => {
            stop();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('blur', handlePointerLeave);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        };
    }
}
