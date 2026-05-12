import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Lora", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "DM Sans", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        coral: {
          50: "#FAECE7",
          100: "#F4D3C7",
          200: "#EDB59F",
          300: "#E48863",
          400: "#D85A30",
          500: "#BD471E",
          600: "#993C1D",
          700: "#7E3217",
          800: "#712B13",
          900: "#4D1D0D",
        },
        purple: {
          50: "#EEEDFE",
          100: "#DCDAFB",
          200: "#BFBAF5",
          300: "#9F98EC",
          400: "#7F77DD",
          500: "#6A61CD",
          600: "#534AB7",
          700: "#443C9C",
          800: "#3C3489",
          900: "#262060",
        },
        teal: {
          50: "#E1F5EE",
          100: "#BFE9D9",
          200: "#8FD7BC",
          300: "#5BC09B",
          400: "#2FA77E",
          500: "#1D9E75",
          600: "#157A5A",
          700: "#0E5A42",
          800: "#093E2D",
        },
        pink: {
          50: "#FBEAF0",
          100: "#F4CDD9",
          200: "#EBA2B8",
          300: "#DC7392",
          400: "#C84A72",
          500: "#B23961",
          600: "#993556",
          700: "#7D2A45",
          800: "#5C1E33",
        },
        amber: {
          50: "#FAEEDA",
          100: "#F4D9AF",
          200: "#ECBE78",
          300: "#DFA146",
          400: "#C68220",
          500: "#A56913",
          600: "#854F0B",
          700: "#693E08",
          800: "#4C2C05",
        },
        neutral: {
          50: "#F8F7F5",
          100: "#EEECEA",
          200: "#DCD9D5",
          300: "#C2BFB9",
          400: "#A4A19B",
          500: "#888780",
          600: "#6A6964",
          700: "#4B4A47",
          800: "#2C2C2A",
          900: "#1A1A19",
        },
      },
      borderRadius: {
        card: "12px",
        pill: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)",
        fab: "0 8px 24px rgba(216, 90, 48, 0.35)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.15)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        pulseDot: "pulseDot 1.2s ease-in-out infinite",
        fadeIn: "fadeIn 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
