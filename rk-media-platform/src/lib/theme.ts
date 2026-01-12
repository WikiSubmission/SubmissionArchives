
export interface ThemeColors {
    bg: string;
    card: string;
    border: string;
    borderHover: string;
    text: string;
    textMuted: string;
    textVeryMuted: string;
    input: string;
    header: string;
    statsBar?: string;
    button: string;
    highlight?: string;
    yearHeader?: string;
}

const DARK_THEME: ThemeColors = {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900',
    border: 'border-zinc-800',
    borderHover: 'hover:border-zinc-700',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    textVeryMuted: 'text-zinc-600',
    input: 'bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-600',
    header: 'bg-black',
    statsBar: 'bg-zinc-950',
    button: 'hover:bg-zinc-900',
    highlight: 'bg-amber-900/30 text-amber-200',
    yearHeader: 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
};

const LIGHT_THEME: ThemeColors = {
    bg: 'bg-gray-50',
    card: 'bg-white',
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textVeryMuted: 'text-gray-400',
    input: 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder:text-gray-400',
    header: 'bg-white',
    statsBar: 'bg-gray-100',
    button: 'hover:bg-gray-100',
    highlight: 'bg-amber-100 text-amber-800',
    yearHeader: 'bg-white border-gray-200 hover:bg-gray-50'
};

export function getTheme(darkMode: boolean): ThemeColors {
    return darkMode ? DARK_THEME : LIGHT_THEME;
}

// Make themes available as constants too
export { DARK_THEME, LIGHT_THEME };
