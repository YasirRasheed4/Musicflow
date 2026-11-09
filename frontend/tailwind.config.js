/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        accent: "var(--color-accent)",
        accent2: "var(--color-accent2)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
      },
      borderColor: {
        DEFAULT: "var(--color-line)",
        line: "var(--color-line)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
