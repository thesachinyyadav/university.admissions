import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Christ University Professional Theme
        primary: {
          50: '#fef5fa',
          100: '#fde9f4',
          200: '#fbd4ea',
          300: '#f9b0da',
          400: '#f57ec4',
          500: '#ee4aaa',
          600: '#254a9a', // Main primary
          700: '#1f3d7f',
          800: '#1a3168',
          900: '#142651',
        },
        secondary: {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fcfcfc',
          300: '#fafafa',
          400: '#f7f7f7',
          500: '#f5f5f5',
          600: '#ffffff', // Pure white
          700: '#e8e8e8',
          800: '#d1d1d1',
          900: '#bababa',
        },
        tertiary: {
          50: '#fdfaf6',
          100: '#fbf5ed',
          200: '#f7ebd9',
          300: '#f0dbbe',
          400: '#e6c49c',
          500: '#d9aa72',
          600: '#bda361', // Main tertiary/gold
          700: '#9e8650',
          800: '#7f6a40',
          900: '#604f2f',
        },
      },
    },
  },
  plugins: [],
};
export default config;
