/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF5F05",
          blue: "#13294B",
          light: "#1F3D6D",
          pale: "#F7FAFF",
        },
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 47.4% 11.2%)",
        card: "hsl(0 0% 100%)",
        cardForeground: "hsl(222.2 47.4% 11.2%)",
        popover: "hsl(0 0% 100%)",
        popoverForeground: "hsl(222.2 47.4% 11.2%)",
        primary: "hsl(24 100% 52%)",
        primaryForeground: "hsl(0 0% 100%)",
        secondary: "hsl(221 39% 11%)",
        secondaryForeground: "hsl(210 40% 98%)",
        muted: "hsl(210 40% 96%)",
        mutedForeground: "hsl(215 16% 46%)",
        accent: "hsl(210 40% 96%)",
        accentForeground: "hsl(222.2 47.4% 11.2%)",
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "#FF5F05",
      },
      boxShadow: {
        soft: "0 10px 25px -10px rgba(19,41,75,0.2)",
        card: "0 8px 24px -12px rgba(19,41,75,0.15)",
        glow: "0 0 0 3px rgba(255,95,5,0.25)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "brand-radial":
          "radial-gradient(1200px 600px at 10% -20%, rgba(255,95,5,0.12), transparent), radial-gradient(800px 400px at 110% 10%, rgba(19,41,75,0.10), transparent)",
        "brand-diag":
          "linear-gradient(135deg, rgba(19,41,75,0.04) 0%, rgba(255,95,5,0.05) 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};
