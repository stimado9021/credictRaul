/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0D0D0E',
          card: '#161618',
          border: '#26262A',
          hover: '#1E1E22',
          input: '#1A1A1E',
        },
        brand: {
          red: '#E52E2E',
          green: '#00C853',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
