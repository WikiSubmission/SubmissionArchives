/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(27, 33%, 97%)',
            '100': 'hsl(27, 33%, 94%)',
            '200': 'hsl(27, 33%, 86%)',
            '300': 'hsl(27, 33%, 76%)',
            '400': 'hsl(27, 33%, 64%)',
            '500': 'hsl(27, 33%, 50%)',
            '600': 'hsl(27, 33%, 40%)',
            '700': 'hsl(27, 33%, 32%)',
            '800': 'hsl(27, 33%, 24%)',
            '900': 'hsl(27, 33%, 16%)',
            '950': 'hsl(27, 33%, 10%)',
            DEFAULT: '#16100b'
        },
        secondary: {
            '50': 'hsl(3, 100%, 97%)',
            '100': 'hsl(3, 100%, 94%)',
            '200': 'hsl(3, 100%, 86%)',
            '300': 'hsl(3, 100%, 76%)',
            '400': 'hsl(3, 100%, 64%)',
            '500': 'hsl(3, 100%, 50%)',
            '600': 'hsl(3, 100%, 40%)',
            '700': 'hsl(3, 100%, 32%)',
            '800': 'hsl(3, 100%, 24%)',
            '900': 'hsl(3, 100%, 16%)',
            '950': 'hsl(3, 100%, 10%)',
            DEFAULT: '#ff5f56'
        },
        accent: {
            '50': 'hsl(28, 28%, 97%)',
            '100': 'hsl(28, 28%, 94%)',
            '200': 'hsl(28, 28%, 86%)',
            '300': 'hsl(28, 28%, 76%)',
            '400': 'hsl(28, 28%, 64%)',
            '500': 'hsl(28, 28%, 50%)',
            '600': 'hsl(28, 28%, 40%)',
            '700': 'hsl(28, 28%, 32%)',
            '800': 'hsl(28, 28%, 24%)',
            '900': 'hsl(28, 28%, 16%)',
            '950': 'hsl(28, 28%, 10%)',
            DEFAULT: '#3b2d21'
        },
        'neutral-50': '#ffffff',
        'neutral-100': '#000000',
        background: '#1d1611',
        foreground: '#000000'
    },
    fontFamily: {
        body: [
            'Inter',
            'sans-serif'
        ],
        font2: [
            'Times New Roman',
            'sans-serif'
        ],
        font3: [
            'LT Superior Serif',
            'sans-serif'
        ]
    },
    fontSize: {
        '12': [
            '12px',
            {
                lineHeight: '19.2px'
            }
        ],
        '13': [
            '13px',
            {
                lineHeight: '19px'
            }
        ],
        '14': [
            '14px',
            {
                lineHeight: '20px',
                letterSpacing: '-0.09px'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: 'normal'
            }
        ],
        '18': [
            '18px',
            {
                lineHeight: '28.8px'
            }
        ],
        '32': [
            '32px',
            {
                lineHeight: '38.4px'
            }
        ],
        '60': [
            '60px',
            {
                lineHeight: '54px',
                letterSpacing: '-1.8px'
            }
        ]
    },
    spacing: {
        '2': '4px',
        '30': '60px',
        '40': '80px',
        '64': '128px',
        '132': '264px',
        '203': '406px'
    },
    borderRadius: {
        xl: '20px',
        full: '50px'
    },
    screens: {
        '1650px': '1650px'
    },
    transitionDuration: {
        '100': '0.1s',
        '200': '0.2s',
        '500': '0.5s',
        '700': '0.7s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0.19, 1, 0.22, 1)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: 'calc(100% - 48px)'
    }
},
  },
};
