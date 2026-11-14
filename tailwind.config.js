/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Tinta: grafito plano, hueso y un solo acento ocre. */
        chrome: 'rgb(var(--chrome) / <alpha-value>)',
        ground: 'rgb(var(--ground) / <alpha-value>)',
        'ground-deep': 'rgb(var(--ground-deep) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        'rule-strong': 'rgb(var(--rule-strong) / <alpha-value>)',

        accent: {
          DEFAULT: '#E87532',
          dark: '#C9571C',
        },

        /* Estados */
        ok: '#3C7461',
        info: '#426AA2',
        amber: '#B9682D',
        coral: '#B84D42',
        cream: '#F5F6F8',

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
        hard: '0 8px 24px -18px rgba(20, 40, 63, .24)',
        'hard-sm': '0 5px 14px -12px rgba(20, 40, 63, .2)',
        lift: '0 12px 28px -18px rgba(20, 40, 63, .28)',
        overlay: '0 18px 42px -20px rgba(20, 40, 63, .3)',
      },
    },
  },
  plugins: [],
};
