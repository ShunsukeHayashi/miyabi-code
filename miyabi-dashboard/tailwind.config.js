/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'miyabi-blue': '#3B82F6',
        'miyabi-purple': '#8B5CF6',
        'miyabi-green': '#10B981',
        'miyabi-yellow': '#F59E0B',
        'miyabi-red': '#EF4444',
      },
    },
  },
  plugins: [],
}
