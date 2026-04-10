/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#FFF7ED",
        ink: "#0F172A",
        sun: "#FB923C",
        coral: "#F43F5E",
        mint: "#14B8A6",
      },
    },
  },
  plugins: [],
};
