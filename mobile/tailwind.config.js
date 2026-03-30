// mobile/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5", // Indigo-600 (from Next.js app)
        secondary: "#db2777", // Pink-600
        background: "#f4f6fb",
      },
    },
  },
  plugins: [],
};
