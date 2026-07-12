/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, appetizing food-app palette
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#E85D04', // main brand orange
          600: '#c94f03',
          700: '#a83f04',
          800: '#87330a',
          900: '#6f2b0c',
        },
        secondary: {
          500: '#2D6A4F', // fresh green accent (veg / natural)
          600: '#1b4332',
        },
        cream: '#FFF8F0',
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(232, 93, 4, 0.15)',
      },
    },
  },
  plugins: [],
};
