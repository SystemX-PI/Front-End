/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#007BFF',   // Azul ConsorTech[cite: 3]
          cyan: '#00A8E8',   // Tom secundário[cite: 3]
          green: '#00FFC2',  // Verde água[cite: 3]
          dark: '#0B0F17',   // Fundo escuro[cite: 3]
          surface: '#161B26', // Superfície de cartões[cite: 3]
        }
      }
    },
  },
  plugins: [],
}