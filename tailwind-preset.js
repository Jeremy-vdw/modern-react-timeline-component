/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Auto-include component files for users
    './node_modules/modern-react-timeline-component/dist/**/*.{js,mjs,cjs}',
  ],
  theme: {
    extend: {
      // Add any custom theme values your component needs
      // colors: {
      //   // Example: custom colors if needed
      //   'timeline-bg': '#f8fafc',
      // },
      // zIndex: {
      //   // Example: if you need specific z-index values
      //   'timeline-header': '10',
      //   'timeline-item': '5',
      // },
      // keyframes: {
      //   // Example: any custom animations
      //   'timeline-fade': {
      //     '0%': { opacity: '0' },
      //     '100%': { opacity: '1' },
      //   },
      // },
      // animation: {
      //   'timeline-fade': 'timeline-fade 0.2s ease-in-out',
      // },
    },
  },
  plugins: [],
};

