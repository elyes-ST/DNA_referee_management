/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/**/*.{js,ts,jsx,tsx}', 
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        flashscore: {
          base: '#0a0a0a',
          card: '#181818',
          border: '#2a2a2a',
          hover: '#222222',
          text: '#ffffff',
          muted: '#a0a0a0',
          accent: '#ce1126'
        }
      }
    }
  },
  plugins: [],
}
