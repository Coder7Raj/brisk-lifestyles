/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Avenir Next', 'Segoe UI', 'system-ui', 'sans-serif'] },
      keyframes: {
        'hero-in': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'hero-in': 'hero-in .6s ease both' },
    },
  },
  plugins: [],
};
