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
        'forest-green':  '#0b5d4a',
        'mid-green':     '#0e7c66',
        'mist-green':    '#ecf8f4',
        'warm-gold':     '#d49a2a',
        'light-gold':    '#e0ad3d',
        'cream':         '#ffffff',
        'parchment':     '#f4f7f6',
      },
      fontFamily: {
        // Loaded via next/font in layout.tsx
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
