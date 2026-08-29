import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cognac: '#9C6644',
          'cognac-dark': '#7F4F24',
          'cognac-light': '#B07D56',
          cream: '#FBF8F3',
          sand: '#F5EFE6',
          parchment: '#EFE7DC',
          border: '#E5DACB',
          'border-light': '#EAE1D5',
          espresso: '#2C241D',
          charcoal: '#43382F',
          muted: '#7D7268',
          gold: '#DDA15E',
          surface: '#FFFFFF',
          // Aliases for seamless backward compatibility
          purple: '#9C6644',
          'purple-light': '#B07D56',
          indigo: '#7F4F24',
          navy: '#2C241D',
          dark: '#1C1917',
          bg: '#FBF8F3',
        },
        node: {
          person: '#4F46E5',
          phone: '#7C3AED',
          vehicle: '#D97706',
          location: '#0284C7',
          organisation: '#9333EA',
          account: '#0D9488',
          case: '#B45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 20px rgba(156, 102, 68, 0.08)',
        'warm-lg': '0 8px 30px rgba(156, 102, 68, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
