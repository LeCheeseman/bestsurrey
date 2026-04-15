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
        // Brand palette — see BestSurrey_BrandBook_v3
        'forest-green':  '#1a4a35',
        'mid-green':     '#2a6a4a',
        'mist-green':    '#e8f0eb',
        'warm-gold':     '#b8882a',
        'light-gold':    '#c49a30',
        'cream':         '#f5f2ec',
        'parchment':     '#ede8de',
      },
      fontFamily: {
        // Cinzel for display/headings, Poppins for body
        // Loaded via next/font in layout.tsx
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
        body:    ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
