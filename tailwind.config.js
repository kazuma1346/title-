/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef2ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          800: "#1e3a8f",
          900: "#1a3a8f",
        }
      },
      fontFamily: {
        sans: ["-apple-system", "Hiragino Sans", "Noto Sans JP", "sans-serif"],
      }
    }
  },
  plugins: []
}
