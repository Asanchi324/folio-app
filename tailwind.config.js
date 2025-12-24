/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        "ink-soft": "#64748B",
        surface: "#FFFFFF",
        "surface-elevated": "#F8FAFC",
        accent: "#0066FF",
        "accent-soft": "#E6F2FF",
        "accent-dark": "#0052CC",
        border: "#E0E7FF",
        danger: "#DC2626",
        success: "#10B981",
        warning: "#F59E0B"
      },
      boxShadow: {
        subtle: "0 2px 8px rgba(0, 102, 255, 0.08)",
        "subtle-lg": "0 4px 16px rgba(0, 102, 255, 0.12)"
      }
    }
  },
  plugins: []
};

 