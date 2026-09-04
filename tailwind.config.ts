import type { Config } from 'tailwindcss';

/**
 * Colours are CSS variables (defined in styles/tokens.css) so light/dark swap
 * without duplicating the scale here. Never add a physical-direction utility
 * to this file — the app is RTL and uses logical properties only.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--c-ink-soft) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-strong': 'rgb(var(--c-primary-strong) / <alpha-value>)',
        'primary-tint': 'rgb(var(--c-primary-tint) / <alpha-value>)',
        'primary-ink': 'rgb(var(--c-primary-ink) / <alpha-value>)',
        // "yes" and "almost" — there is deliberately no red in this palette.
        yes: 'rgb(var(--c-yes) / <alpha-value>)',
        'yes-tint': 'rgb(var(--c-yes-tint) / <alpha-value>)',
        almost: 'rgb(var(--c-almost) / <alpha-value>)',
        'almost-tint': 'rgb(var(--c-almost-tint) / <alpha-value>)',
        streak: 'rgb(var(--c-streak) / <alpha-value>)',
        strand: {
          numbers: 'rgb(var(--c-strand-numbers) / <alpha-value>)',
          ratio: 'rgb(var(--c-strand-ratio) / <alpha-value>)',
          algebra: 'rgb(var(--c-strand-algebra) / <alpha-value>)',
          functions: 'rgb(var(--c-strand-functions) / <alpha-value>)',
          geometry: 'rgb(var(--c-strand-geometry) / <alpha-value>)',
          stats: 'rgb(var(--c-strand-stats) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Base is deliberately large: dense small text is an anxiety trigger.
        base: ['1.125rem', { lineHeight: '1.75' }],
        lg: ['1.25rem', { lineHeight: '1.7' }],
        xl: ['1.5rem', { lineHeight: '1.5' }],
        '2xl': ['1.875rem', { lineHeight: '1.35' }],
        '3xl': ['2.25rem', { lineHeight: '1.25' }],
      },
      borderRadius: { md: '0.875rem', lg: '1.25rem', xl: '1.75rem', '2xl': '2rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--c-shadow) / 0.04), 0 4px 16px rgb(var(--c-shadow) / 0.06)',
        lift: '0 2px 4px rgb(var(--c-shadow) / 0.05), 0 12px 32px rgb(var(--c-shadow) / 0.10)',
      },
      transitionDuration: { DEFAULT: '180ms' },
      keyframes: {
        'pop-in': { '0%': { opacity: '0', transform: 'translateY(6px) scale(.98)' }, '100%': { opacity: '1', transform: 'none' } },
        sparkle: { '0%': { opacity: '0', transform: 'scale(.4)' }, '40%': { opacity: '1' }, '100%': { opacity: '0', transform: 'scale(1.6)' } },
      },
      animation: {
        'pop-in': 'pop-in 220ms cubic-bezier(.22,1,.36,1) both',
        sparkle: 'sparkle 600ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
