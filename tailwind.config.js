/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
        condensed: ["'Barlow Condensed'", "sans-serif"],
      },
      colors: {
        orange: { 500: "#f97316" },
      },
    },
  },
  plugins: [],
};
