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
        // Tokens de AeroCRM (TS-008), tomados de la maqueta de referencia (Google Stitch,
        // sistema "Andean Horizon"). Las pantallas usan primary-*, accent-* y success-*;
        // cambiar aquí cambia toda la plataforma.
        // primary: azul marino. Encabezados, textos fuertes, enlaces y superficies de marca (700 = #0A2540).
        primary: {
          50: '#f0f5fd',
          100: '#e1ebfa',
          200: '#c3d5ee',
          300: '#97b2d6',
          400: '#6585b3',
          500: '#3d5c82',
          600: '#1b3a5c',
          700: '#0a2540',
          800: '#071b31',
          900: '#000f22',
        },
        // accent: naranja atardecer. Solo para la acción principal, el paso activo y lo seleccionado.
        // 500 (#FF5A1F) es el de la maqueta; los botones usan 600 para que el texto blanco
        // cumpla el contraste AA de WCAG 2.1 que pide el Plan de Calidad.
        accent: {
          50: '#fff6f1',
          100: '#ffe9dd',
          200: '#ffcfb8',
          300: '#ffb59e',
          400: '#ff8a5c',
          500: '#ff5a1f',
          600: '#c93d0a',
          700: '#ae3200',
          800: '#852400',
          900: '#521300',
        },
        // success: verde valle. Ahorros, descuentos, estados confirmados y puntos ganados.
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
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
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Niveles de elevación de la maqueta: tarjeta en reposo, tarjeta elegida y paneles fijos.
        card: '0 4px 12px -2px rgba(10, 37, 64, 0.04), 0 2px 4px -1px rgba(10, 37, 64, 0.02)',
        raised: '0 12px 24px -4px rgba(10, 37, 64, 0.08), 0 4px 8px -2px rgba(10, 37, 64, 0.03)',
        float: '0 20px 32px -8px rgba(10, 37, 64, 0.12)',
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
