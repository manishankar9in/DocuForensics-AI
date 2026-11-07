/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === PRIMARY BACKGROUNDS ===
        'primary-bg': '#070B12',
        'secondary-bg': '#0D1420',
        background: '#070B12',
        'background-secondary': '#0D1420',

        // === SURFACES ===
        surface: {
          DEFAULT: '#121B29',
          elevated: '#172235',
        },
        'surface-card': '#121B29',

        // === BORDERS ===
        border: {
          DEFAULT: '#243247',
          subtle: '#1B2738',
        },

        // === TEXT ===
        'primary-text':   '#F1F5F9',
        'secondary-text': '#A7B4C7',
        'muted-text':     '#718096',
        'disabled-text':  '#4B5A70',

        // Legacy text aliases kept for components
        'text-primary':   '#F1F5F9',
        'text-secondary': '#A7B4C7',
        'text-muted':     '#718096',
        'text-disabled':  '#4B5A70',

        // === FORENSIC TEAL ACCENT ===
        accent: {
          DEFAULT: '#20B8A6',
          hover:   '#1DA595',
          light:   'rgba(32, 184, 166, 0.12)',
        },
        'accent-hover': '#1DA595',
        primary: {
          DEFAULT: '#20B8A6',
          hover:   '#1DA595',
          light:   'rgba(32, 184, 166, 0.12)',
        },

        // === STATUS ===
        'status-critical': '#EF4444',
        'status-warning':  '#F59E0B',
        'status-success':  '#22C55E',
        'status-info':     '#3B82F6',

        // Legacy status aliases
        critical: '#EF4444',
        warning:  '#F59E0B',
        success:  '#22C55E',
        info:     '#3B82F6',
      },
      borderRadius: {
        card:  '10px',
        btn:   '8px',
        input: '8px',
        modal: '12px',
      },
      boxShadow: {
        card:     '0 4px 20px rgba(0, 0, 0, 0.25)',
        elevated: '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
