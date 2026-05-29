/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#211334",
        steel: "#62536f",
        line: "#e8ddf7",
        panel: "#fbf8ff",
        action: "#7c3aed",
        warn: "#a16207",
        danger: "#b91c1c"
      }
    }
  },
  plugins: []
};
