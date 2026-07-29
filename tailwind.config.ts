import type { Config } from 'tailwindcss';

/**
 * Every colour resolves to a CSS variable declared in globals.css, as an RGB
 * triplet so the `/opacity` modifier keeps working (bg-panel/70, border-line/50).
 * Light and dark are two token sets, not one flipped automatically.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: rgb('--bg'),
        panel: { DEFAULT: rgb('--panel'), 2: rgb('--panel-2'), 3: rgb('--panel-3') },
        line: { DEFAULT: rgb('--line'), strong: rgb('--line-strong') },
        ink: { DEFAULT: rgb('--ink'), 2: rgb('--ink-2'), 3: rgb('--ink-3') },
        brand: {
          DEFAULT: rgb('--brand'),
          hover: rgb('--brand-hover'),
          ink: rgb('--brand-ink'),
          wash: rgb('--brand-wash'),
        },
        risk: {
          high: rgb('--risk-high'),
          medium: rgb('--risk-medium'),
          low: rgb('--risk-low'),
          safe: rgb('--risk-safe'),
        },
        series: {
          1: rgb('--series-1'),
          2: rgb('--series-2'),
          3: rgb('--series-3'),
          4: rgb('--series-4'),
          5: rgb('--series-5'),
        },
        grid: rgb('--grid'),
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Tighter tracking at display sizes is most of what separates a
        // "web app" feel from a scaled-up mobile one.
        'display': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '650' }],
        'title': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading': ['1.0625rem', { lineHeight: '1.35', letterSpacing: '-0.011em', fontWeight: '600' }],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      spacing: { 'sidebar': '15.5rem', 'sidebar-collapsed': '4.25rem', 'topbar': '3.5rem' },
      maxWidth: { shell: '110rem' },
      transitionTimingFunction: { swift: 'cubic-bezier(0.32, 0.72, 0, 1)' },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out both',
        'rise': 'rise 260ms cubic-bezier(0.32,0.72,0,1) both',
        'pop': 'pop 160ms cubic-bezier(0.32,0.72,0,1) both',
        'scan-sweep': 'scanSweep 2.2s ease-in-out infinite',
        'indeterminate': 'indeterminate 1.2s ease-in-out infinite',
        'spin-slow': 'spin 1.1s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        pop: { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'none' } },
        scanSweep: { '0%,100%': { top: '4%' }, '50%': { top: '96%' } },
        indeterminate: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
      },
    },
  },
  plugins: [],
};
export default config;
