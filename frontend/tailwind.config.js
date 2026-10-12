/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  // Safelist dynamic classes used with [ngClass] bindings
  safelist: [
    // Navy palette
    { pattern: /bg-navy-(700|800|900|950)/ },
    { pattern: /text-navy-(200|300|400|500|600)/ },
    { pattern: /border-navy-(600|700|800)/ },
    // Gold palette
    { pattern: /bg-gold-(500|400)/ },
    { pattern: /text-gold-(300|400|500)/ },
    { pattern: /border-gold-(500)/ },
    // Status colors (flight, ticket, badge)
    { pattern: /bg-(emerald|amber|red|purple|blue|gray|orange|slate)-(400|500|600)\/[0-9]+/ },
    { pattern: /text-(emerald|amber|red|purple|blue|gray|orange|slate)-(300|400)/ },
    { pattern: /border-(emerald|amber|red|purple|blue|gray|orange|slate)-(500|600)/ },
    { pattern: /border-l-(emerald|amber|red|purple|blue|gray|orange)-(400|500)/ },
    // Animation
    'animate-pulse', 'animate-spin', 'animate-enter',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens de AeroCRM (TS-008). [AJUSTAR] con los colores de la maqueta de referencia.
        // Las pantallas usan primary-*; cambiar aquí cambia toda la plataforma.
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Paletas heredadas del sistema anterior (docs/HEREDADO.md). No usar en pantallas nuevas.
        navy: {
          950: '#050d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162d58',
          600: '#1e3d70',
          500: '#2452a0',
          400: '#3366c2',
          300: '#5580d0',
          200: '#8aaae0',
        },
        gold: {
          700: '#8a6428',
          600: '#a07830',
          500: '#c9a84c',
          400: '#d4b96a',
          300: '#e0cc94',
          200: '#f0e4c0',
          100: '#faf5e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-top': 'slideInTop 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
