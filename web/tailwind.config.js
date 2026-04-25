/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ritual: {
          black: '#000000',
          elevated: '#111827',  // Card backgrounds
          surface: '#1F2937',   // Input fields
          overlay: 'rgba(0,0,0,0.8)',
          green: '#19D184',     // TEE verified, success
          lime: '#BFFF00',      // Data emphasis, highlights
          pink: '#FF1DCE',      // AI/agent features
          gold: '#FACC15',      // Warnings, pending
          red: '#EF4444',       // Errors
        },
        // Keep COGNOXIDE brand accent as primary lime
        accent: '#C8FF00',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Izoard', 'Archivo Black', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Barlow', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 30px -5px rgba(25, 209, 132, 0.25)',
        'glow-pink': '0 0 30px -5px rgba(255, 29, 206, 0.2)',
        'card': '0 4px 40px -12px rgba(0, 0, 0, 0.5)',
        'glow-accent': '0 0 40px -8px rgba(200, 255, 0, 0.35)',
      },
      animation: {
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(25, 209, 132, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 29, 206, 0.1) 0px, transparent 50%)',
        'noise': 'url("/noise.png")',
      },
    },
  },
  plugins: [],
}
