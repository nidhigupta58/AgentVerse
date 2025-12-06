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
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}

