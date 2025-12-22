/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        "ink-soft": "#64748B",
        surface: "#F8FAFC",
        "surface-elevated": "#FFFFFF",
        accent: "#2563EB",
        "accent-soft": "#DBEAFE",
        border: "#E2E8F0",
        danger: "#DC2626"
      },
      boxShadow: {
        subtle: "0 8px 30px rgba(15, 23, 42, 0.04)"
      }
    }
  },
  plugins: []
};

 