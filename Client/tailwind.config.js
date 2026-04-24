/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50:  '#f4f6ee',
          100: '#e5ebd4',
          200: '#cdd9ae',
          300: '#adc07f',
          400: '#8ea758',
          500: '#718d3e',
          600: '#567030',
          700: '#435729',
          800: '#374725',
          900: '#2f3d22',
          950: '#172010',
        },
        cream: '#FFF8EC',
        parchment: '#F7F4EE',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'Inter', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-18px)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float:           'float 5s ease-in-out infinite',
        'float-delay':   'float 5s ease-in-out 1.5s infinite',
        'slide-in-right':'slide-in-right 0.35s ease-out',
        'fade-up':       'fade-up 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
