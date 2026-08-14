import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#101a26",
        terra: "#51210d",
        "terra-light": "#d98a4e",
        sand: "#998376",
        offwhite: "#F5F3F0",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "nav-blur": "0 14px 34px rgba(16, 26, 38, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
