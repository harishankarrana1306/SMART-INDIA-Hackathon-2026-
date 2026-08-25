import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B0D1B',
          purple: '#5F01FB',
          'purple-light': '#7D33FC',
          indigo: '#514A85',
          bg: '#F7F7FC',
          border: '#E8E6F1',
          muted: '#6B6980',
          dark: '#111322',
        },
        node: {
          person: '#5F01FB',
          phone: '#8B5CF6',
          vehicle: '#514A85',
          location: '#38BDF8',
          organisation: '#A78BFA',
          account: '#14B8A6',
          case: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
