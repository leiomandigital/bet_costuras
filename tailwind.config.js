/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        status: {
          'a-produzir': 'hsl(var(--status-a-produzir) / <alpha-value>)',
          'em-andamento': 'hsl(var(--status-em-andamento) / <alpha-value>)',
          finalizado: 'hsl(var(--status-finalizado) / <alpha-value>)',
          'aguardando-entrega': 'hsl(var(--status-aguardando-entrega) / <alpha-value>)',
          entregue: 'hsl(var(--status-entregue) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        base: ['16px', '1.5'],
        lg: ['18px', '1.5'],
        'title-sm': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        title: ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        dashboard: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
