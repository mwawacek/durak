import type { Config } from 'tailwindcss';

/**
 * "Durak / Bito" design tokens — warm-dark with a single warm-coral accent.
 * No casino felt, no wood, no glassmorphism. Clean zones, serif card faces.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0907',
          mid: '#100e0b',
          top: '#1b1815',
          card: '#1a1714',
        },
        surface: {
          card: '#fbfaf7',
          panel: 'rgba(255,255,255,0.035)',
          panelStrong: 'rgba(255,255,255,0.06)',
        },
        line: {
          subtle: 'rgba(255,255,255,0.06)',
          mid: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.18)',
        },
        text: {
          primary: '#fbfaf7',
          secondary: 'rgba(255,255,255,0.5)',
          tertiary: 'rgba(255,255,255,0.32)',
          label: 'rgba(255,255,255,0.42)',
        },
        accent: {
          DEFAULT: '#ff6f5e',
          light: '#ff8a7a',
          deep: '#ff5a48',
          glow: 'rgba(255,111,94,0.18)',
          ring: 'rgba(255,111,94,0.45)',
          haze: 'rgba(255,111,94,0.08)',
          soft: 'rgba(255,111,94,0.12)',
        },
        suit: {
          red: '#e23b46',
          black: '#15161a',
        },
      },
      fontFamily: {
        serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '0.5rem',
        panel: '1.125rem',
        pill: '9999px',
        sheet: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 14px -6px rgba(0,0,0,0.45)',
        cardSelected:
          '0 14px 30px -10px rgba(255,111,94,0.5), 0 2px 6px rgba(0,0,0,0.3)',
        cta: '0 10px 24px -10px rgba(255,90,72,0.6), inset 0 0 0 0.5px rgba(255,255,255,0.18)',
        panel: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        toast: '0 10px 30px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 240ms cubic-bezier(.2,.7,.2,1) both',
        'pulse-ring': 'pulse-ring 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
