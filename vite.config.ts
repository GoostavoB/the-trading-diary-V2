import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger(),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Phase 2: Bundle Size Optimization
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',

    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64

    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

        manualChunks: {
          // Framework core - 150KB
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // UI Library - Split into smaller chunks
          'vendor-ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
          ],
          'vendor-ui-forms': [
            '@radix-ui/react-select',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
          ],
          'vendor-ui-other': [
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
          ],

          // Charts - only loaded on analytics pages
          'vendor-charts': ['recharts'],

          // Animation libraries
          'vendor-animation': ['framer-motion', 'gsap'],

          // Heavy utilities
          'vendor-utils': [
            'date-fns',
            'date-fns-tz',
            'crypto-js',
            '@tanstack/react-query',
          ],

          // Supabase - only for authenticated pages
          'vendor-supabase': ['@supabase/supabase-js'],

          // AI/3D libraries - rarely used, separate chunk
          'vendor-threejs': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },

      // Tree-shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },

    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.warn'] : [],
        passes: 2, // Run compression twice for better results
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true, // Fix Safari 10+ bugs
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Source maps only for production debugging (not in bundle)
    sourcemap: mode === 'production' ? 'hidden' : true,

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Stricter limit

    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,

    // Report compressed file sizes
    reportCompressedSize: true,
  },
}));
