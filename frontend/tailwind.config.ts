import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#A7D08C", // Matcha Green
        secondary: "#FFF9E6", // Cream
        accent: "#5D4037", // Dark Brown/Cocoa
        "background-light": "#FFFDF5",
        "background-dark": "#1A1C18",
        matcha: {
          primary: "#A7D08C",
          soft: "#E0F2F1",
          dark: "#86B36A"
        },
        cream: {
          yellow: "#FFF9E6"
        },
        latte: {
          brown: "#5D4037"
        }
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        sans: ["Quicksand", "sans-serif"],
      },
      borderRadius: {
        large: "3.5rem",
        medium: "2rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
export default config;
