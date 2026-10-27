/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Tinta: grafito plano, hueso y un solo acento ocre. */
        chrome: '#07080B', /* barra fija (navbar) */
        ground: '#101216', /* lienzo */
        'ground-deep': '#0B0E12', /* superficies hundidas */
        surface: '#191D22', /* fichas, cards, paneles */
        'surface-raised': '#22272D', /* menús, hover, elevados */
        ink: '#F2EFE6',
        'ink-2': '#C2C4BF',
        'ink-3': '#8A8F8B',
        rule: '#33383D',
        'rule-strong': '#6E757C',

        accent: {
          DEFAULT: '#E3B04B',
          dark: '#C9922F',
        },

        /* Estados */
        ok: '#7FB08A',
        info: '#86A9E0',
        amber: '#D99A5E',
        coral: '#E0715F',
        cream: '#F2EFE6',

        /* Documento: la única superficie clara, solo al imprimir. */
        paper: '#F5F2E8',
        'paper-sunk': '#EDE9DC',
        'paper-rule': '#D8D2C0',
        'paper-ink': '#171A1F',
        ochre: '#C6862A',

        /* Alias heredados que siguen usándose en plantillas. */
        signal: '#E0715F',
        subtle: '#33383D',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        serif: ['Petrona', 'Georgia', 'serif'],
      },
      boxShadow: {
        /* Elevación dura: bloque desplazado, sin difuminado. */
        hard: '4px 4px 0 0 #05060A',
        'hard-sm': '3px 3px 0 0 #05060A',
        lift: '6px 6px 0 0 #05060A',
        overlay: '6px 6px 0 0 #05060A',
      },
    },
  },
  plugins: [],
};
