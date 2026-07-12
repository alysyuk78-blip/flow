/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      fontSize: {
        "ios-body": ["17px", { lineHeight: "22px", letterSpacing: "-0.41px" }],
        "ios-subhead": ["15px", { lineHeight: "20px", letterSpacing: "-0.24px" }],
        "ios-footnote": ["13px", { lineHeight: "18px", letterSpacing: "-0.08px" }],
        "ios-caption": ["12px", { lineHeight: "16px", letterSpacing: "0px" }],
        "ios-title2": ["22px", { lineHeight: "28px", letterSpacing: "0.35px" }],
        "ios-title3": ["20px", { lineHeight: "25px", letterSpacing: "0.38px" }],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(1rem)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.96)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-0.5rem)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-smooth both",
        "fade-out": "fade-out 0.2s ease-smooth both",
        "slide-in-right": "slide-in-right 0.3s ease-smooth both",
        "slide-in-left": "slide-in-left 0.3s ease-smooth both",
        "slide-up": "slide-up 0.35s ease-smooth both",
        "scale-in": "scale-in 0.25s ease-smooth both",
        "slide-down": "slide-down 0.25s ease-smooth both",
      },
    },
  },
  plugins: [],
};
