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
        dm: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        // Background Stack
        'navy-950': '#060D1F',    // Page background (Abyss)
        'navy-900': '#0A1628',    // Card surface (Deep Navy)
        'navy-800': '#0F2044',    // Elevated surface
        'navy-700': '#152B5E',
        'navy-600': '#1B3678',

        // Legacy aliases (existing classes won't break)
        'abyss': '#060D1F',
        'bg-deep': '#060D1F',
        'bg-card': '#0A1628',

        // Electric Blue System
        'electric': '#4F6EF7',    // Primary CTA
        'electric-light': '#7B93FF',
        'electric-dim': '#2B47D4',
        'accent': '#4F6EF7',

        // Cyber Cyan
        'cyber': '#00D4E8',    // Accent / highlights
        'cyber-light': '#5EEAF7',
        'cyber-dim': '#009AB0',
        'accent-teal': '#00D4E8',
        'accent-violet': '#8B5CF6',

        // Semantic Security
        'emerald': '#00E5A0',    // Verified / success
        'emerald-dim': '#00A872',
        'auth-green': '#00E5A0',
        'trust-safe': '#00E5A0',

        'amber': '#F5A623',    // Risk warning
        'alert-amber': '#F5A623',
        'trust-watch': '#F5A623',

        'rose': '#FF4D6D',    // Anomaly / danger
        'threat-rose': '#FF4D6D',
        'trust-danger': '#FF4D6D',

        // Text
        'primary': '#F0F4FF',    // Ice White
        'secondary': '#8A9CC8',    // Slate
        'muted': '#4D5E85',    // Muted labels

        // Surface & Border tokens
        'surface-1': 'rgba(255,255,255,0.04)',
        'surface-2': 'rgba(255,255,255,0.07)',
        'surface-3': 'rgba(255,255,255,0.11)',
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.09)',
        'glass-accent': 'rgba(79,110,247,0.4)',
      },
      borderRadius: {
        'glass': '20px',
        'card': '16px',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'electric': '0 4px 20px rgba(79,110,247,0.35)',
        'glow-green': '0 0 50px rgba(0,229,160,0.3)',
        'glow-rose': '0 0 50px rgba(255,77,109,0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
