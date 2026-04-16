import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist_v19',
    emptyOutDir: false,   // preserve files like KOEL_Pricing_Template.xlsx that live in outDir
  },
})
