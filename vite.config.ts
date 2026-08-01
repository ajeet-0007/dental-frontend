import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['DentZoo_Logo.svg', 'offline.html'],
      manifest: {
        name: 'Dentzoo - Dental Products Online',
        short_name: 'Dentzoo',
        description: 'Your one-stop shop for dental products',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'dentzoo-v1',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/sitemap\.xml$/, /robots\.txt$/, /\.(xml|txt|json|webmanifest)$/],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "dental-frontend-0osw.onrender.com",
      "dental-frontend-l6lddma3g-ajeet0007s-projects.vercel.app",
    ],
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
