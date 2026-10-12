/** Brand colours resolve through the variables set in src/lib/theme.ts. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/shared/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: token("accent"),
        bg: token("bg"),
        fg: token("fg"),
        highlight: token("highlight"),
        ink: token("ink"),
        line: token("line"),
        muted: token("muted"),
        "on-primary": token("on-primary"),
        primary: token("primary"),
        shelf: token("shelf"),
        surface: token("surface"),
      },
      fontFamily: {
        // Store-signage face for screen titles and shelf labels. Body text
        // stays on the platform font.
        display: ["Oswald_600SemiBold"],
      },
    },
  },
  plugins: [],
};
