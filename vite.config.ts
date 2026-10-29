import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/bingo-game/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.png'],
      manifest: {
        name: 'Bingo en vivo',
        short_name: 'Bingo',
        description: 'Bingo 75 para jugar desde el celular, con números en vivo.',
        theme_color: '#9333ea',
        background_color: '#15131a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // La app es casi toda tiempo real (números/reclamos vía Supabase) - cachear solo
      // el cascarón de la app (JS/CSS/HTML/ícono), nunca las respuestas de Supabase.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
})
