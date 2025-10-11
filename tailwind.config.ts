import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-comfortaa)", "sans-serif"],
        mono: ["var(--font-comfortaa)", "monospace"],
        comfortaa: ["var(--font-comfortaa)", "sans-serif"],
      },
    },
  },
} satisfies Config


