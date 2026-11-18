
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      colors: {
        brand: {
          yellow: "#FACC15",
          hover: "#EAB308",
          dark: "#CA8A04",
        },

        dark: {
          main: "#111111",
          sidebar: "#0A0A0A",
          card: "#1C1C1C",
          elevated: "#242424",
          border: "#333333",
          muted: "#A3A3A3",
        },
      },

      boxShadow: {
        yellow: "0 0 20px rgba(250, 204, 21, 0.12)",
      },

      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },

  plugins: [],
};
