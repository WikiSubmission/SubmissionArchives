'use client';

import { SlidersHorizontal } from 'lucide-react';
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
}

/**
 * The reading sheet. It owns the reader's typographic preferences and applies
 * them as data attributes on the <article>, which the stylesheet reads. The
 * prose itself stays server-rendered.
 */
export default function EditorialReader({ children, header }: EditorialReaderProps) {
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
            <div className="mb-6 flex items-center justify-end border-b border-ed-rule pb-3">
                <div className="relative">
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        aria-expanded={panelOpen}
                        aria-controls={panelId}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-transparent text-ed-fg-muted transition-colors hover:border-ed-rule hover:text-ed-fg"
                    >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Reading settings</span>
                    </button>

                    {panelOpen ? (
                        <div
                            ref={panelRef}
                            id={panelId}
                            role="group"
                            aria-label="Reading settings"
                            className="absolute right-0 top-12 z-20 w-60 rounded-[8px] border border-ed-rule bg-ed-surface-raised p-4 shadow-sm"
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
            <p className="mb-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">{label}</p>
            <div className="flex gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={value === option.value}
                        className="flex-1 rounded-[4px] border border-ed-rule px-2 py-2 text-[11px] font-medium text-ed-fg-muted transition-colors hover:text-ed-fg aria-pressed:border-ed-accent aria-pressed:bg-ed-accent-soft aria-pressed:text-ed-accent"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
