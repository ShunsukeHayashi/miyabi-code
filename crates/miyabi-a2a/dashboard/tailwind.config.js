import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'miyabi-primary': '#6366f1',
        'miyabi-success': '#10b981',
        'miyabi-warning': '#f59e0b',
        'miyabi-error': '#ef4444',
        'miyabi-info': '#3b82f6',
        'agent-leader': '#ef4444',
        'agent-executor': '#10b981',
        'agent-analyst': '#3b82f6',
        'agent-support': '#f59e0b',
        'status-submitted': '#94a3b8',
        'status-working': '#6366f1',
        'status-completed': '#10b981',
        'status-failed': '#ef4444',
        'status-cancelled': '#64748b',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
