/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'bg-deep': '#0A0B1A',
        'bg-card': '#111228',
        'accent': '#6C63FF',
        'accent-violet': '#8B5CF6',
        'accent-teal': '#06B6D4',
        'trust-safe': '#10B981',
        'trust-watch': '#F59E0B',
        'trust-danger': '#EF4444',
        'primary': '#F1F0FF',
        'secondary': '#8B8DB8',
      },
      borderRadius: {
        'glass': '20px',
        'card': '16px',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
