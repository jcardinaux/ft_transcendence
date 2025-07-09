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
        'win98-gray-light': '#C0C0C0', // Grigio delle finestre e pulsanti
        'win98-gray-medium': '#808080', // Grigio scuro per ombre
        'win98-gray-dark': '#303030',  // Grigio ancora più scuro per bordi barra titolo
        'win98-blue-dark': '#0A246A', // Blu scuro della barra del titolo
        'win98-blue-light': '#1084d0', // Grigio-blu chiaro della barra del titolo
      },
      fontFamily: {
        // Puoi definire un font specifico Win98 se lo importi o hai un fallback simile
        'win98': ['"MS Sans Serif"', 'Arial', 'sans-serif'],
      },
      // Utility per text-shadow (richiede un plugin o aggiunta manuale)
      textShadow: {
        'win98': '1px 1px 0 #ffffff',
      }
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.text-shadow-win98': {
          'text-shadow': theme('textShadow.win98'),
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover']);
    }
  ],
}

