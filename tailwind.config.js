/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A78F2',
        primaryLight: '#5A93FF',
        primaryDark: '#2F5ECC',
        background: '#F8FBFF',
        text: '#0D1B2A',
      },
    },
  },
  plugins: [],
}

