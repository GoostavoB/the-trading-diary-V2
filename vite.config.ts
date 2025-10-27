import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const ENABLE_PWA = process.env.VITE_ENABLE_PWA === 'true';
  const BUILD_ID = new Date().toISOString();
  
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger(),
    ...(ENABLE_PWA ? [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'logo-192.png', 'logo-512.png'],
        manifest: {
          name: 'The Trading Diary',
          short_name: 'Trading Diary',
          description: 'Track, analyze, and review every crypto trade with AI',
          theme_color: '#4A90E2',
          background_color: '#050a14',
          display: 'standalone',
          icons: [
            {
              src: 'logo-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ] : []),
  ],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Phase 2: Bundle Size Optimization
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Framework core - 150KB
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Library - 200KB (Radix UI is large)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
          ],
          
          // Charts - only loaded on analytics pages
          'vendor-charts': ['recharts'],
          
          // Heavy utilities
          'vendor-utils': [
            'date-fns',
            'date-fns-tz',
            'crypto-js',
            '@tanstack/react-query',
          ],
          
          // Supabase - only for authenticated pages
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // AI/3D libraries - rarely used
          'vendor-threejs': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    
    // Optimize CSS
    cssCodeSplit: true,
  },
}});
