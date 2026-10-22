/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-2': 'var(--color-accent-2)',
        'accent-ink': 'var(--color-accent-ink)',
        'accent-soft': 'var(--color-accent-soft)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { card: 'var(--shadow-card)', pop: 'var(--shadow-pop)', lift: 'var(--shadow-lift)' },
      transitionDuration: { fast: 'var(--dur-fast)', base: 'var(--dur-base)', slow: 'var(--dur-slow)' },
      zIndex: { nav: '30', overlay: '40', toast: '50' },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
