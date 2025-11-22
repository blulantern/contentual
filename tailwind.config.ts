import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'contentual-pink': {
          DEFAULT: '#E178C5',
          50: '#FDF4FA',
          100: '#FAE9F5',
          200: '#F5D3EB',
          300: '#EFBCE0',
          400: '#EA9AD3',
          500: '#E178C5',
          600: '#D84FB3',
          700: '#C42D9A',
          800: '#9A2378',
          900: '#6F1A56',
        },
        'contentual-coral': {
          DEFAULT: '#FF8E8F',
          50: '#FFF5F5',
          100: '#FFEBEB',
          200: '#FFD7D7',
          300: '#FFC3C3',
          400: '#FFAFAF',
          500: '#FF8E8F',
          600: '#FF6A6B',
          700: '#FF4647',
          800: '#E62223',
          900: '#B31B1C',
        },
        'contentual-peach': {
          DEFAULT: '#FFB38E',
          50: '#FFF9F5',
          100: '#FFF2EB',
          200: '#FFE5D7',
          300: '#FFD7C3',
          400: '#FFC9AF',
          500: '#FFB38E',
          600: '#FF9D6D',
          700: '#FF874C',
          800: '#FF712B',
          900: '#E65A10',
        },
        'contentual-cream': {
          DEFAULT: '#FFFDCB',
          50: '#FFFEF5',
          100: '#FFFDCB',
          200: '#FFFCB7',
          300: '#FFFBA3',
          400: '#FFFA8F',
          500: '#FFF97B',
          600: '#FFF867',
          700: '#FFF753',
          800: '#FFF63F',
          900: '#E6DD39',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E178C5 0%, #FFB38E 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FF8E8F 0%, #FFB38E 100%)',
        'gradient-card': 'linear-gradient(135deg, #FFFDCB 0%, #FFB38E 50%, #FF8E8F 100%)',
        'gradient-hero': 'linear-gradient(180deg, #FFFDCB 0%, #FFF 100%)',
        'gradient-radial': 'radial-gradient(circle at top right, #E178C5 0%, #FFB38E 50%, #FFFDCB 100%)',
        'gradient-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(225, 120, 197, 0.05)',
        'card': '0 4px 6px -1px rgba(225, 120, 197, 0.1), 0 2px 4px -1px rgba(225, 120, 197, 0.06)',
        'soft': '0 10px 15px -3px rgba(225, 120, 197, 0.1), 0 4px 6px -2px rgba(225, 120, 197, 0.05)',
        'soft-lg': '0 20px 25px -5px rgba(225, 120, 197, 0.15), 0 10px 10px -5px rgba(225, 120, 197, 0.04)',
        'colored': '0 10px 30px -5px rgba(225, 120, 197, 0.3)',
        'colored-lg': '0 20px 40px -10px rgba(225, 120, 197, 0.4)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(225, 120, 197, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
