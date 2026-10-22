import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: [
        'favicon.ico',
        'favicon-16.png',
        'favicon-32.png',
        'icon-192.png',
        'icon-512.png',
        'logo-extrucol.png',
      ],
      manifest: {
        name: 'Teo · Disponibilidad de Stock — Extrucol',
        short_name: 'Teo',
        description: 'Disponibilidad de stock y despachos en tiempo real — Extrucol',
        theme_color: '#293B91',
        background_color: '#F4F5F7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
