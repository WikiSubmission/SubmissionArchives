'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
    darkMode: boolean;
    toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [darkMode, setDarkMode] = useState(true); // Default to dark mode

    const applyTheme = (isDark: boolean) => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.dataset.theme = theme;
        document.body.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
    };

    useEffect(() => {
        // Load preference from local storage
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            setDarkMode(true);
            applyTheme(true);
        } else if (saved === 'light') {
            setDarkMode(false);
            applyTheme(false);
        } else {
            // Default to dark mode if no preference saved
            setDarkMode(true);
            applyTheme(true);
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        applyTheme(newMode);
    };

    // Prevent hydration mismatch by not rendering until mounted
    // OR render with default but accept flicker. 
    // For best UX, we render children but initialized state might differ.
    // However, since we read from localStorage in useEffect, initial render is always false (light).
    // This is standard for Next.js to avoid hydration errors.

    // Sync class on mount/change
    useEffect(() => {
        applyTheme(darkMode);
    }, [darkMode]);

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
