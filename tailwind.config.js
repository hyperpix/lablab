import frappePreset from 'frappe-ui/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [frappePreset],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/frappe-ui/src/utils/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // We can define custom premium theme colors if needed
      }
    },
  },
  plugins: [],
}
