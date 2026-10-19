/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pos: {
          // Primary FARMAX Brand Palette
          primary: '#E85D04',
          'primary-hover': '#D45103',
          'primary-soft': '#FFF1E8',
          accent: '#E85D04',
          'accent-hover': '#D45103',
          'accent-soft': '#FFF1E8',

          // Neutrals & Surfaces
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-subtle': '#F1F5F9',
          'surface-hover': '#F1F5F9',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
          sidebar: '#FFFFFF',
          header: '#FFFFFF',

          // Typography Neutrals
          text: '#0F172A',
          'text-secondary': '#475569',
          'text-muted': '#64748B',
          disabled: '#94A3B8',

          // Semantics
          success: '#16A34A',
          'success-soft': '#DCFCE7',
          'success-bg': '#DCFCE7',
          warning: '#D97706',
          'warning-soft': '#FEF3C7',
          'warning-bg': '#FEF3C7',
          danger: '#DC2626',
          'danger-soft': '#FEE2E2',
          'danger-bg': '#FEE2E2',
          info: '#2563EB',
          'info-soft': '#DBEAFE',
          'info-bg': '#DBEAFE',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '8px', // Default component radius: 8px
        xl: '12px', // Modals / drawers
        '2xl': '12px',
      },
      boxShadow: {
        pos: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'pos-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
