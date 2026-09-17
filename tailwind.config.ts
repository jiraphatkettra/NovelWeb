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
        accent: {
          DEFAULT: "#f59e0b",
          hover: "#d97706",
          light: "#fef3c7",
          dim: "rgba(245, 158, 11, 0.12)",
        },
        obsidian: {
          bg: "#09090b",
          card: "#121215",
          surface: "#18181b",
          border: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.04)",
        },
        kakao: {
          yellow: "#f59e0b",
          "yellow-hover": "#d97706",
          black: "#09090b",
          dark: "#09090b",
          card: "#121215",
          surface: "#18181b",
          border: "rgba(255, 255, 255, 0.08)",
          muted: "#a1a1aa",
          "muted-dark": "#71717a",
        },
        paper: {
          light: "#ffffff",
          sepia: "#f7efe2",
          dark: "#16161a",
          black: "#09090b",
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
