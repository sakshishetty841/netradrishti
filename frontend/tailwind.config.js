/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        retina: {
          cream: '#FFF9F2',
          mint: '#B8F2E6',
          lavender: '#CDB4DB',
          peach: '#FFCFB2',
          pink: '#FF8FAB',
          navy: '#243B53',
        }
      }
    },
  },
  plugins: [],
}
