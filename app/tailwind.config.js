/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
    "./public/**/*.ts"
  ],
  theme: {
    extend: {
      colors: {
        'win98-bg': '#008080',      // Il classico verde-acqua dello sfondo
        'win98-gray-extraLight' : '#D0D0D0',
        'win98-gray-light': '#C0C0C0', // Grigio delle finestre e pulsanti
        'win98-gray-medium': '#808080', // Grigio scuro per ombre
        'win98-gray-dark': '#303030',  // Grigio ancora più scuro per bordi barra titolo
        'win98-blue-dark': '#0A246A', // Blu scuro della barra del titolo
        'win98-blue-light': '#1084d0', // Grigio-blu chiaro della barra del titolo
        'win98-white': '#fff',
      },
      fontFamily: {
        'win98': ['"MS Sans Serif"', 'Arial', 'sans-serif'],
      },
      textShadow: {
        'win98': '1px 1px 0 #ffffff',
        'glow': '0 0 2px #fff, 0 0 6px #fff, 0 0 12px #fff, 0 0 24px #fff',
      }
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.text-shadow-win98': {
          'text-shadow': theme('textShadow.win98'),
        },
        '.text-shadow-glow': {
          'text-shadow': theme('textShadow.glow'),
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover']);
    }
  ],
}

