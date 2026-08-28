'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import {
    parseReadingSettings,
    readingSettingsStore,
    READING_ALIGN_OPTIONS,
    READING_MEASURE_OPTIONS,
    READING_SIZE_OPTIONS,
    type ReadingSettings,
} from '@/lib/readingSettings';

interface EditorialReaderProps {
    /** The compiled MDX body, rendered on the server and passed through. */
    children: ReactNode;
    /** Rendered above the prose, inside the same sheet. */
    header: ReactNode;
    /** Editorial title for breadcrumb */
    title?: string;
    prevSlug?: string;
    nextSlug?: string;
}

/**
 * The reading sheet matching Making Software:
 * Clean top toolbar with `< > SECTION / CHAPTER` in Departure Mono and settings trigger.
 */
export default function EditorialReader({
    children,
    header,
    title,
    prevSlug,
    nextSlug,
}: EditorialReaderProps) {
    const snapshot = useSyncExternalStore(
        readingSettingsStore.subscribe,
        readingSettingsStore.getSnapshot,
        readingSettingsStore.getServerSnapshot,
    );
    const settings = useMemo(() => parseReadingSettings(snapshot), [snapshot]);

    const [panelOpen, setPanelOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();

    const update = useCallback(
        (patch: Partial<ReadingSettings>) => {
            readingSettingsStore.write({ ...settings, ...patch });
        },
        [settings],
    );

    useEffect(() => {
        if (!panelOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setPanelOpen(false);
            triggerRef.current?.focus();
        };

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            setPanelOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [panelOpen]);

    return (
        <div className="relative">
            {/* Top Toolbar matching Making Software */}
            <div className="mb-8 flex items-center justify-between gap-3 border-b border-ed-rule/60 pb-3">
                {/* Left Breadcrumb & Prev/Next Arrows */}
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex shrink-0 items-center gap-1 text-ed-fg-faint">
                        {prevSlug ? (
                            <Link
                                href={`/editorials/${prevSlug}`}
                                aria-label="Previous editorial"
                                className="p-0.5 text-ed-fg-faint transition-colors hover:text-ed-fg"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <span className="p-0.5 opacity-30">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </span>
                        )}
                        {nextSlug ? (
                            <Link
                                href={`/editorials/${nextSlug}`}
                                aria-label="Next editorial"
                                className="p-0.5 text-ed-fg-faint transition-colors hover:text-ed-fg"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <span className="p-0.5 opacity-30">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        )}
                    </div>

                    <div
                        className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-ed-fg-muted"
                        style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}
                    >
                        <Link href="/editorials" className="transition-colors hover:text-ed-fg">
                            MONOGRAPHS
                        </Link>
                        {title ? (
                            <>
                                <span className="mx-1.5 text-ed-fg-faint">/</span>
                                <span className="text-ed-fg truncate">{title}</span>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Right Reading Settings Trigger */}
                <div className="relative shrink-0">
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        aria-expanded={panelOpen}
                        aria-controls={panelId}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-fg"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">Reading settings</span>
                    </button>

                    {panelOpen ? (
                        <div
                            ref={panelRef}
                            id={panelId}
                            role="group"
                            aria-label="Reading settings"
                            className="absolute right-0 top-10 z-30 w-60 rounded-[6px] border border-ed-rule bg-ed-surface-raised p-4 shadow-lg"
                        >
                            <SettingRow
                                label="Type size"
                                options={READING_SIZE_OPTIONS}
                                value={settings.size}
                                onChange={(value) => update({ size: value })}
                            />
                            <SettingRow
                                label="Measure"
                                options={READING_MEASURE_OPTIONS}
                                value={settings.measure}
                                onChange={(value) => update({ measure: value })}
                            />
                            <SettingRow
                                label="Alignment"
                                options={READING_ALIGN_OPTIONS}
                                value={settings.align}
                                onChange={(value) => update({ align: value })}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            <article
                className="editorial-prose"
                data-size={settings.size}
                data-measure={settings.measure}
                data-align={settings.align}
            >
                {header}
                {children}
            </article>
        </div>
    );
}

interface SettingRowProps<T extends string> {
    label: string;
    options: ReadonlyArray<{ value: T; label: string }>;
    value: T;
    onChange: (value: T) => void;
}

function SettingRow<T extends string>({ label, options, value, onChange }: SettingRowProps<T>) {
    return (
        <div className="mb-3 last:mb-0">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ed-fg-faint" style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}>
                {label}
            </p>
            <div className="flex gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={value === option.value}
                        className="flex-1 rounded-[4px] border border-ed-rule px-2 py-1.5 font-sans text-[11px] font-medium text-ed-fg-muted transition-colors hover:text-ed-fg aria-pressed:border-ed-accent aria-pressed:bg-ed-accent-soft aria-pressed:text-ed-accent"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
