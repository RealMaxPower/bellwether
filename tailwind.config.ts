import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}", "./content/**/*.{md,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Broadsheet palette — driven by CSS variables in globals.css so a
        // `.dark` class on <html> can flip every token without touching usages.
        ink: {
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          2: "rgb(var(--paper-2) / <alpha-value>)",
          edge: "rgb(var(--paper-edge) / <alpha-value>)",
        },
        oxblood: "rgb(var(--oxblood) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        ochre: "rgb(var(--ochre) / <alpha-value>)",
        indigo: "rgb(var(--indigo) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          muted: "rgb(var(--accent-muted) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)",
        },
        // Semantic data-viz colors
        expansion: "rgb(var(--teal) / <alpha-value>)",
        contraction: "rgb(var(--oxblood) / <alpha-value>)",
        recession: "rgb(var(--ink-700) / <alpha-value>)",
        // Policy lane categories — repointed to editorial accents
        policy: {
          monetary: "rgb(var(--indigo) / <alpha-value>)",
          fiscal: "rgb(var(--ochre) / <alpha-value>)",
          trade: "rgb(var(--teal) / <alpha-value>)",
          regulatory: "rgb(var(--ink-500) / <alpha-value>)",
          exogenous: "rgb(var(--oxblood) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "ui-serif", "Georgia", "serif"],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        // Editorial type scale
        "display-1": ["clamp(2.5rem, 5vw + 1rem, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2rem, 3.5vw + 1rem, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "title-1": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "title-2": ["1.375rem", { lineHeight: "1.25" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "caption": ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.005em" }],
      },
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26, 24, 20, 0.04), 0 4px 12px rgba(26, 24, 20, 0.06)",
        drawer: "-16px 0 40px rgba(26, 24, 20, 0.10)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        "live-pulse": "live-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
