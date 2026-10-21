/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Plano: suelo azul profundo y líneas claras. */
        ground: '#0C1A33',
        'ground-deep': '#081224',
        surface: '#102443',
        'surface-raised': '#153055',
        ink: '#E8EFFA',
        'ink-2': '#AFC0DA',
        'ink-3': '#8FA3C2',
        rule: '#2A3F61',
        'rule-strong': '#4A648C',
        cyan: {
          DEFAULT: '#6FD3E0',
          dark: '#4FB8C6',
        },
        amber: '#E9B45C',
        coral: '#F07167',
        cream: '#F2EDE1',

        /* Documento: la única superficie clara. */
        paper: '#F5F3ED',
        'paper-sunk': '#EDEAE1',
        'paper-rule': '#DAD5C7',
        'paper-ink': '#171A1F',
        ochre: '#C6862A',

        /* Alias heredados que siguen usándose en plantillas. */
        signal: '#F07167',
        subtle: '#2A3F61',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        serif: ['Petrona', 'Georgia', 'serif'],
      },
      boxShadow: {
        overlay: '0 24px 60px -24px rgba(0, 0, 0, 0.75)',
      },
    },
  },
  plugins: [],
};
