/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#0F172A',
          surface: '#1E293B',
          'surface-hover': '#334155',
          border: '#334155',
          text: '#F8FAFC',
          'text-muted': '#94A3B8',
          accent: '#3B82F6',
          'accent-hover': '#2563EB',
          success: '#10B981',
          'success-bg': 'rgba(16, 185, 129, 0.15)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.15)',
          danger: '#EF4444',
          'danger-bg': 'rgba(239, 68, 68, 0.15)',
          sidebar: '#0B1120',
          header: '#1E293B',
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
      boxShadow: {
        pos: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'pos-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
