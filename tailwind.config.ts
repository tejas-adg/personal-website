import { type Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background-dark": "#22223b",
        "background-light": "#f1f5f9",
        "card-background-dark": "#181828",
      },
    },
  }
} satisfies Config;
