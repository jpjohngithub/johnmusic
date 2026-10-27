/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          spotify: '#1DB954',
          youtube: '#FF0000',
          tiktok: '#00F2FE',
          accent: '#A855F7'
        }
      }
    },
  },
  plugins: [],
}
