// React Theme — extracted from https://egregore.xyz
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
 *   };
 *   fonts: {
    mono: string;
    body: string;
 *   };
 *   fontSizes: {
    '12': string;
    '13': string;
    '14': string;
    '16': string;
    '18': string;
    '32': string;
    '60': string;
 *   };
 *   space: {
    '4': string;
    '60': string;
    '80': string;
    '128': string;
    '264': string;
    '406': string;
 *   };
 *   radii: {
    xl: string;
    full: string;
 *   };
 *   shadows: {

 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#16100b",
    "secondary": "#ff5f56",
    "accent": "#3b2d21",
    "background": "#1d1611",
    "foreground": "#000000",
    "neutral50": "#ffffff",
    "neutral100": "#000000"
  },
  "fonts": {
    "mono": "'IBM Plex Mono', monospace",
    "body": "'LT Superior Serif', sans-serif"
  },
  "fontSizes": {
    "12": "12px",
    "13": "13px",
    "14": "14px",
    "16": "16px",
    "18": "18px",
    "32": "32px",
    "60": "60px"
  },
  "space": {
    "4": "4px",
    "60": "60px",
    "80": "80px",
    "128": "128px",
    "264": "264px",
    "406": "406px"
  },
  "radii": {
    "xl": "20px",
    "full": "50px"
  },
  "shadows": {},
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#16100b",
      "light": "hsl(27, 33%, 21%)",
      "dark": "hsl(27, 33%, 10%)"
    },
    "secondary": {
      "main": "#ff5f56",
      "light": "hsl(3, 100%, 82%)",
      "dark": "hsl(3, 100%, 52%)"
    },
    "background": {
      "default": "#1d1611",
      "paper": "#f5f2ed"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#16100b"
    }
  },
  "typography": {
    "fontFamily": "'IBM Plex Mono', sans-serif",
    "h1": {
      "fontSize": "32px",
      "fontWeight": "400",
      "lineHeight": "38.4px"
    },
    "body1": {
      "fontSize": "16px",
      "fontWeight": "400",
      "lineHeight": "normal"
    },
    "body2": {
      "fontSize": "13px",
      "fontWeight": "400",
      "lineHeight": "19px"
    }
  },
  "shape": {
    "borderRadius": 20
  },
  "shadows": []
};

export default theme;
