import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Arharius-CyberMap-Showcase/',
  plugins: [react()],
  // Resolve deck.gl's browser-oriented dependencies through Vite in Node tests.
  test: { server: { deps: { inline: [/@deck\.gl/, /@luma\.gl/, /wgsl_reflect/] } } },
})
