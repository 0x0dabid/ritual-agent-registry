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
          primary: '#0A0A0A',
          accent: '#C8FF00',  // Neon lime from COGNOXIDE brand
          dark: '#111111',
          gray: '#666666',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(200, 255, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(200, 255, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
