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
        kakao: {
          yellow: "#FFE600",
          "yellow-hover": "#FFD600",
          black: "#000000",
          dark: "#0A0A0C",
          card: "#121215",
          surface: "#1A1A1E",
          border: "#222226",
          muted: "#999999",
          "muted-dark": "#666666",
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
