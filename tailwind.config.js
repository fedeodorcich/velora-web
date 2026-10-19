/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F3ED',
        surface: '#FFFFFF',
        ink: '#171A1F',
        cobalt: {
          DEFAULT: '#1E3FAE',
          dark: '#17308A',
        },
        ochre: '#C6862A',
        signal: '#C0392B',
        subtle: '#E4E1D8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
