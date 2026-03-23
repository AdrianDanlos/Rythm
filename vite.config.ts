import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('/jspdf/')
          ) return 'vendor-jspdf'
          if (
            id.includes('/html2canvas/')
            || id.includes('/canvg/')
            || id.includes('/stackblur-canvas/')
            || id.includes('/rgbcolor/')
            || id.includes('/svg-pathdata/')
          ) return 'vendor-html2canvas'
          if (
            id.includes('/recharts/')
            || id.includes('/d3-')
            || id.includes('/victory-vendor/')
          ) return 'vendor-charts'
          if (id.includes('/@supabase/')) return 'vendor-supabase'
          if (
            id.includes('/react-dom/')
            || id.includes('/react/')
            || id.includes('/scheduler/')
            || id.includes('/react-router/')
          ) return 'vendor-react'
          if (
            id.includes('/framer-motion/')
            || id.includes('/motion-dom/')
            || id.includes('/motion-utils/')
          ) return 'vendor-motion'
          if (
            id.includes('/i18next/')
            || id.includes('/react-i18next/')
            || id.includes('/i18next-browser-languagedetector/')
          ) return 'vendor-i18n'
          return undefined
        },
      },
    },
  },
})
