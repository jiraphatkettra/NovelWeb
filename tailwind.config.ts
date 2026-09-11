import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#fbf7ee",
          100: "#f5ecce",
          200: "#ebd99b",
          300: "#dec063",
          400: "#d4a938",
          500: "#b88a24",
          600: "#96691c",
          700: "#754d1a",
          800: "#603e1b",
          900: "#52351c",
          950: "#2f1b0c",
        },
        paper: {
          light: "#ffffff",
          sepia: "#fbf0d9",
          dark: "#1e1e24",
          black: "#0b0b0e",
        },
      },
      fontFamily: {
        sarabun: ["var(--font-sarabun)", "Sarabun", "sans-serif"],
        baijamjuree: ["var(--font-baijamjuree)", "Bai Jamjuree", "sans-serif"],
        prompt: ["var(--font-prompt)", "Prompt", "sans-serif"],
        kanit: ["var(--font-kanit)", "Kanit", "sans-serif"],
        mitr: ["var(--font-mitr)", "Mitr", "sans-serif"],
        chonburi: ["var(--font-chonburi)", "Chonburi", "serif"],
        charm: ["var(--font-charm)", "Charm", "cursive"],
        mali: ["var(--font-mali)", "Mali", "cursive"],
        kodchasan: ["var(--font-kodchasan)", "Kodchasan", "sans-serif"],
        noto: ["var(--font-noto)", "Noto Sans Thai", "sans-serif"],
        ibm: ["var(--font-ibm)", "IBM Plex Sans Thai", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
