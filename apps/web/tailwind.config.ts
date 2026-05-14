import type { Config } from 'tailwindcss';

/**
 * Design tokens — single source of truth for the "Classic Mahogany" palette.
 * Mirrors apps/mobile/src/theme/colors.ts in spirit; some values are
 * structured as colour scales so utility classes feel natural
 * (`bg-mahogany`, `text-gold-light`, `border-gold/40`).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#15110d',
        ink: '#1a0905',
        mahogany: {
          dark: '#160803',
          DEFAULT: '#2a1108',
          light: '#4a2418',
          highlight: '#6a3a22',
        },
        felt: {
          dark: '#07140d',
          mid: '#0f2317',
          DEFAULT: '#1d3826',
        },
        gold: {
          deep: '#8a5a1f',
          dark: '#b88a3a',
          DEFAULT: '#d4a548',
          light: '#e6c478',
          highlight: '#f0d68f',
        },
        burgundy: {
          dark: '#2a0a0d',
          DEFAULT: '#5a1a1f',
        },
        red: {
          darkest: '#4a0c0b',
          deep: '#8a201f',
          DEFAULT: '#c83a36',
          bright: '#c83a36',
          count: '#ff9a90',
          pip: '#ff8a82',
        },
        cream: {
          dim: 'rgba(243,231,200,0.7)',
          DEFAULT: '#f3e7c8',
          soft: '#fff7e0',
        },
        cardFace: {
          DEFAULT: '#fbf6ec',
          shadow: '#f1e6cd',
        },
        cardSuit: {
          red: '#a8201f',
          black: '#1a1410',
        },
        defending: '#5fbd83',
        warmAlert: '#ffaa50',
        face: {
          J: '#5a3a1f',
          Q: '#5a1a2f',
          K: '#1f2f5a',
          A: '#3a1f5a',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        serif: [
          '"Cormorant Garamond"',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '0.5rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0,0,0,0.45)',
        raised: '0 8px 12px rgba(0,0,0,0.6)',
        brass: '0 4px 12px rgba(212,165,72,0.4)',
        feltInner: 'inset 0 2px 6px rgba(0,0,0,0.45)',
      },
      keyframes: {
        'pulse-outline': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'pulse-outline': 'pulse-outline 1.4s ease-in-out infinite',
        'fade-up': 'fade-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'gold-shimmer': 'gold-shimmer 6s linear infinite',
      },
      backgroundImage: {
        // Subtle felt texture — diagonal weave overlaid on the base felt colour.
        'felt-weave':
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 4px), repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 5px)',
        // Wood-grain stripes for the body background.
        'wood-grain':
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 7px), radial-gradient(120% 90% at 50% 0%, #2a1108 0%, #160803 60%, #0d0502 100%)',
        // Engraved gold-foil text gradient (paired with bg-clip-text).
        'gold-foil':
          'linear-gradient(180deg, #fbe69c 0%, #d4a548 45%, #8a5a1f 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
