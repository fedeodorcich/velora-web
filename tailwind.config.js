/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Escalera de valores: cada superficie un peldaño sobre la anterior. */
        chrome: '#070F1C', /* barra fija (navbar, menús) */
        ground: '#12243F', /* lienzo */
        'ground-deep': '#081224', /* superficies hundidas (.panel, ficha-head) */
        surface: '#1D3355', /* fichas, cards, paneles */
        'surface-raised': '#26406A', /* menús, hover, elevados */
        ink: '#E8EFFA',
        'ink-2': '#AFC0DA',
        'ink-3': '#97ABCA',
        rule: '#3A537F',
        'rule-strong': '#5E7CA8',
        cyan: {
          DEFAULT: '#6FD3E0',
          dark: '#4FB8C6',
        },
        amber: '#E9B45C',
        coral: '#F4857C',
        cream: '#F2EDE1',

        /* Documento: la única superficie clara. */
        paper: '#F5F3ED',
        'paper-sunk': '#EDEAE1',
        'paper-rule': '#DAD5C7',
        'paper-ink': '#171A1F',
        ochre: '#C6862A',

        /* Alias heredados que siguen usándose en plantillas. */
        signal: '#F4857C',
        subtle: '#3A537F',
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
