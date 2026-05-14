import type { Config } from 'tailwindcss';

/**
 * Design tokens — "Midnight Velvet": late-night card-room atmosphere.
 * Deep navy base, electric crimson and warm amber accents, glassy surfaces.
 * Mirrored (subset) in src/theme/tokens.ts for inline SVG / inline style.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // App backdrop scale — cool, deep, with subtle blue cast
        ink: {
          950: '#06080f',
          900: '#0a0e1a',
          800: '#0e1424',
          700: '#141b30',
          600: '#1b2540',
          500: '#243054',
        },
        // Glass surfaces use white at low opacity directly via tailwind's
        // /5, /10, /15 modifiers — no token needed.

        // Felt for the game table — emerald shifted darker
        felt: {
          dark: '#031a1a',
          mid: '#072a2a',
          DEFAULT: '#0d3b3b',
          light: '#0f4747',
        },

        // Electric crimson — primary brand colour, attacker, danger
        crimson: {
          50: '#fff1f4',
          100: '#ffd9e0',
          200: '#ffadbc',
          400: '#ff5572',
          500: '#ff3b5f',
          600: '#e63956',
          700: '#b8243e',
          800: '#7c1729',
        },

        // Warm amber — secondary accent, gold-leaf moments, host badge
        amber: {
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },

        // Mint — defender / connected / success
        mint: {
          300: '#6ee7b7',
          400: '#5eead4',
          500: '#34d399',
          600: '#10b981',
        },

        // Card / text light tones
        bone: {
          DEFAULT: '#fafaf7',
          dim: '#e7e5e0',
          mute: 'rgba(250,250,247,0.65)',
          ghost: 'rgba(250,250,247,0.4)',
        },

        // Card colours
        cardFace: {
          DEFAULT: '#fafaf7',
          shadow: '#eceae3',
        },
        cardSuit: {
          red: '#dc2626',
          ink: '#0f172a',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '0.875rem',
        pill: '9999px',
        sheet: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 1px rgba(0,0,0,0.04), 0 6px 24px -8px rgba(0,0,0,0.6)',
        raised: '0 4px 6px rgba(0,0,0,0.2), 0 24px 48px -16px rgba(0,0,0,0.7)',
        crimson: '0 8px 24px -8px rgba(255,59,95,0.5)',
        amber: '0 8px 24px -8px rgba(251,191,36,0.5)',
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -12px rgba(0,0,0,0.6)',
        glassRaised: 'inset 0 1px 0 0 rgba(255,255,255,0.12), 0 6px 12px rgba(0,0,0,0.3), 0 24px 48px -16px rgba(0,0,0,0.8)',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'aurora-pan': {
          '0%, 100%': { transform: 'translate3d(0%, 0%, 0)' },
          '50%': { transform: 'translate3d(2%, -1%, 0)' },
        },
        'sheen': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.6s ease-in-out infinite',
        'fade-up': 'fade-up 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'aurora-pan': 'aurora-pan 12s ease-in-out infinite',
        'sheen': 'sheen 3.5s ease-in-out infinite',
      },
      backgroundImage: {
        // Vibrant button gradient (subtle vertical wash)
        'crimson-flat':
          'linear-gradient(180deg, #ff5572 0%, #ff3b5f 50%, #e63956 100%)',
        'amber-flat':
          'linear-gradient(180deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)',
        // Aurora behind the body — three blurred blobs
        'aurora':
          'radial-gradient(50% 35% at 12% 8%, rgba(255,59,95,0.20) 0%, transparent 65%), radial-gradient(45% 40% at 88% 18%, rgba(94,234,212,0.14) 0%, transparent 65%), radial-gradient(60% 50% at 50% 95%, rgba(251,191,36,0.13) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
