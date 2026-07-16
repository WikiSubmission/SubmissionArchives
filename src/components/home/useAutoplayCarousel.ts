'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FocusEvent,
    type PointerEvent,
    type RefObject,
} from 'react';

type UseAutoplayCarouselOptions = {
    count: number;
    intervalMs: number;
    initialIndex?: number;
    rootMargin?: string;
};

type SwipeOrigin = {
    x: number;
    y: number;
    pointerId: number;
};

function useReducedMotionPreference() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(mediaQuery.matches);

        update();
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    return reducedMotion;
}

function useDocumentVisibility() {
    const [isDocumentVisible, setIsDocumentVisible] = useState(true);

    useEffect(() => {
        const update = () => setIsDocumentVisible(document.visibilityState === 'visible');

        update();
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);

    return isDocumentVisible;
}

function useElementVisibility<T extends Element>(
    ref: RefObject<T | null>,
    rootMargin: string,
) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        if (!('IntersectionObserver' in window)) {
            queueMicrotask(() => setIsVisible(true));
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin, threshold: 0.08 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, rootMargin]);

    return isVisible;
}

export function useAutoplayCarousel({
    count,
    intervalMs,
    initialIndex = 0,
    rootMargin = '240px 0px',
}: UseAutoplayCarouselOptions) {
    const rootRef = useRef<HTMLDivElement>(null);
    const swipeOriginRef = useRef<SwipeOrigin | null>(null);
    const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)));
    const [isManuallyPaused, setIsManuallyPaused] = useState(false);
    const [isInteractionPaused, setIsInteractionPaused] = useState(false);
    const reducedMotion = useReducedMotionPreference();
    const isDocumentVisible = useDocumentVisibility();
    const isInView = useElementVisibility(rootRef, rootMargin);

    const next = useCallback(() => {
        if (count <= 1) return;
        setIndex((current) => (current + 1) % count);
    }, [count]);

    const previous = useCallback(() => {
        if (count <= 1) return;
        setIndex((current) => (current - 1 + count) % count);
    }, [count]);

    const goTo = useCallback((nextIndex: number) => {
        if (count <= 0) return;
        setIndex(Math.min(Math.max(nextIndex, 0), count - 1));
    }, [count]);

    const autoplayEnabled =
        count > 1
        && !reducedMotion
        && isDocumentVisible
        && isInView
        && !isManuallyPaused
        && !isInteractionPaused;

    useEffect(() => {
        if (!autoplayEnabled) return;

        const timeout = window.setTimeout(next, intervalMs);
        return () => window.clearTimeout(timeout);
    }, [autoplayEnabled, index, intervalMs, next]);

    const onPointerEnter = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse') setIsInteractionPaused(true);
    }, []);

    const onPointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse') setIsInteractionPaused(false);
    }, []);

    const onFocusCapture = useCallback(() => setIsInteractionPaused(true), []);

    const onBlurCapture = useCallback((event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsInteractionPaused(false);
        }
    }, []);

    const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'touch') return;

        swipeOriginRef.current = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
        };
        setIsInteractionPaused(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }, []);

    const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
        const origin = swipeOriginRef.current;
        swipeOriginRef.current = null;
        setIsInteractionPaused(false);

        if (!origin || origin.pointerId !== event.pointerId) return;

        const deltaX = origin.x - event.clientX;
        const deltaY = origin.y - event.clientY;
        const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

        if (!isHorizontalSwipe) return;
        if (deltaX > 0) next();
        else previous();
    }, [next, previous]);

    return {
        rootRef,
        index,
        goTo,
        next,
        previous,
        reducedMotion,
        isManuallyPaused,
        setIsManuallyPaused,
        autoplayEnabled,
        interactionProps: {
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
            onPointerCancel: () => {
                swipeOriginRef.current = null;
                setIsInteractionPaused(false);
            },
            onFocusCapture,
            onBlurCapture,
        },
    };
}
