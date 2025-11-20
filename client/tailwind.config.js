/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f5ff',
          100: '#e3e8ff',
          200: '#c7d0ff',
          300: '#a4afff',
          400: '#7b86f9',
          500: '#5863f8',
          600: '#3c46d8',
          700: '#2f36aa',
          800: '#272d85',
          900: '#1d2266',
        },
        secondary: {
          50: '#f4faf7',
          100: '#e6f6ed',
          200: '#bce7d4',
          300: '#8fd7b9',
          400: '#5cc39d',
          500: '#3ca682',
          600: '#2f8567',
          700: '#276d55',
          800: '#215a46',
          900: '#1b4b3a',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },

        // ShadCN theme tokens
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 47.4% 11.2%)',
        muted: 'hsl(210 40% 96.1%)',
        'muted-foreground': 'hsl(215.4 16.3% 46.9%)',
        card: 'hsl(0 0% 100%)',
        'card-foreground': 'hsl(222.2 47.4% 11.2%)',
        border: 'hsl(214.3 31.8% 91.4%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
