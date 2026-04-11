/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          red: "#DC2626",
          orange: "#EA580C",
          yellow: "#FBBF24",
        }
      }
    },
  },
  plugins: [],
}
