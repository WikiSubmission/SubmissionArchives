'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useSyncExternalStore,
    type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
    theme: Theme;
    darkMode: boolean;
    setTheme: (theme: Theme) => void;
    toggleDarkMode: () => void;
};

const THEME_STORAGE_KEY = 'theme';
const THEME_CHANGE_EVENT = 'submission-archives-theme-change';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getServerSnapshot(): Theme {
    return 'dark';
}

function getThemeSnapshot(): Theme {
    if (typeof document === 'undefined') return getServerSnapshot();
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function subscribeToTheme(callback: () => void) {
    const handleStorage = (event: StorageEvent) => {
        if (event.key === THEME_STORAGE_KEY) callback();
    };

    window.addEventListener(THEME_CHANGE_EVENT, callback);
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, callback);
        window.removeEventListener('storage', handleStorage);
    };
}

function applyTheme(theme: Theme) {
    const isDark = theme === 'dark';
    const root = document.documentElement;

    root.classList.toggle('dark', isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (document.body) {
        document.body.dataset.theme = theme;
    }
}

function persistTheme(theme: Theme) {
    applyTheme(theme);

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Storage can be unavailable in private or restricted browsing contexts.
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = useSyncExternalStore(
        subscribeToTheme,
        getThemeSnapshot,
        getServerSnapshot,
    );

    const setTheme = useCallback((nextTheme: Theme) => {
        persistTheme(nextTheme);
    }, []);

    const toggleDarkMode = useCallback(() => {
        persistTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme]);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        darkMode: theme === 'dark',
        setTheme,
        toggleDarkMode,
    }), [setTheme, theme, toggleDarkMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
