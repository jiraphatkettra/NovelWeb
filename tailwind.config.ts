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
          yellow: "#8B5CF6", // Electric Violet as primary accent
          "yellow-hover": "#7C3AED",
          purple: "#8B5CF6",
          lavender: "#A78BFA",
          black: "#000000",
          dark: "#09090B",
          card: "#111116",
          surface: "#181720",
          border: "#23222A",
          muted: "#9CA3AF",
          "muted-dark": "#6B7280",
        },
        brand: {
          primary: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
          surface: "#121118",
          card: "#181722",
          border: "rgba(255, 255, 255, 0.08)",
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
