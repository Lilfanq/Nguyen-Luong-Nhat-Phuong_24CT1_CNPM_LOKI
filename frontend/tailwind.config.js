/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-purple': '#0D0714',
        'cyber-card': 'rgba(26, 11, 46, 0.5)',
        'cyber-green': '#00FF66',
      }
    },
  },
  plugins: [],
}