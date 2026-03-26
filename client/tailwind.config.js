/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        broadcast: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1f1f1f',
          red: '#dc2626',
          green: '#16a34a'
        }
      }
    },
  },
  plugins: [],
}
