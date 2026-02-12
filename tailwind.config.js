/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        cyber: {
          bg: '#0a0a12', // Blackish Blue
          dark: '#14142b', // Deep Blue
          primary: '#3b82f6', // Neon Blue
          secondary: '#ef4444', // Crimson Red (Warning/Action)
          accent: '#ff0055', // Hot Pink
          text: '#e0e0e0', // Light Gray
          muted: '#6b7280', // Gray
          window: {
            bg: '#1a1a2e',
            border: '#4b5563',
            title: '#111827'
          }
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Slate dark gradient
      },
      boxShadow: {
        'neon-blue': '0 0 5px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5)',
        'neon-red': '0 0 5px #ef4444, 0 0 20px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}
