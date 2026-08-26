export type ReadingTypeSize = 's' | 'm' | 'l';
export type ReadingMeasure = 'normal' | 'wide';
export type ReadingAlignment = 'justify' | 'start';

export interface ReadingSettings {
    size: ReadingTypeSize;
    measure: ReadingMeasure;
    align: ReadingAlignment;
}

export const READING_SETTINGS_STORAGE_KEY = 'sa:editorial-reading';

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
    size: 'm',
    measure: 'normal',
    align: 'justify',
};

export const READING_SIZE_OPTIONS: ReadonlyArray<{ value: ReadingTypeSize; label: string }> = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
];

export const READING_MEASURE_OPTIONS: ReadonlyArray<{ value: ReadingMeasure; label: string }> = [
    { value: 'normal', label: 'Narrow' },
    { value: 'wide', label: 'Wide' },
];

export const READING_ALIGN_OPTIONS: ReadonlyArray<{ value: ReadingAlignment; label: string }> = [
    { value: 'justify', label: 'Justified' },
    { value: 'start', label: 'Ragged' },
];

const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_READING_SETTINGS);

/** Persisted preferences are untrusted input: unknown values fall back. */
export function parseReadingSettings(raw: string | null): ReadingSettings {
    if (!raw) return DEFAULT_READING_SETTINGS;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return DEFAULT_READING_SETTINGS;
    }

    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_READING_SETTINGS;
    const candidate = parsed as Partial<Record<keyof ReadingSettings, unknown>>;

    return {
        size: READING_SIZE_OPTIONS.some((option) => option.value === candidate.size)
            ? (candidate.size as ReadingTypeSize)
            : DEFAULT_READING_SETTINGS.size,
        measure: READING_MEASURE_OPTIONS.some((option) => option.value === candidate.measure)
            ? (candidate.measure as ReadingMeasure)
            : DEFAULT_READING_SETTINGS.measure,
        align: READING_ALIGN_OPTIONS.some((option) => option.value === candidate.align)
            ? (candidate.align as ReadingAlignment)
            : DEFAULT_READING_SETTINGS.align,
    };
}

const CHANGE_EVENT = 'sa:editorial-reading-change';

/**
 * A minimal external store over localStorage, so the reading sheet can hydrate
 * with the server's defaults and then adopt the reader's saved preferences
 * without a synchronous setState in an effect.
 */
export const readingSettingsStore = {
    subscribe(onChange: () => void): () => void {
        window.addEventListener(CHANGE_EVENT, onChange);
        // Keeps two open tabs in step.
        window.addEventListener('storage', onChange);

        return () => {
            window.removeEventListener(CHANGE_EVENT, onChange);
            window.removeEventListener('storage', onChange);
        };
    },

    /** Returns the raw JSON string so the snapshot stays referentially stable. */
    getSnapshot(): string {
        try {
            return window.localStorage.getItem(READING_SETTINGS_STORAGE_KEY) ?? DEFAULT_SNAPSHOT;
        } catch {
            // Private browsing can throw on access; defaults are a safe read.
            return DEFAULT_SNAPSHOT;
        }
    },

    getServerSnapshot(): string {
        return DEFAULT_SNAPSHOT;
    },

    write(settings: ReadingSettings): void {
        try {
            window.localStorage.setItem(READING_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // Preferences are a convenience; failing to persist is not an error.
        }
        window.dispatchEvent(new Event(CHANGE_EVENT));
    },
};
