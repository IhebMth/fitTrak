import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import path from 'path';

// Define __dirname if it's not available
const __dirname = path.resolve();

export default defineConfig({
  plugins: [
    react(),
    cesium(), // Adds proper support for Cesium
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Aliasing Cesium's source is typically unnecessary with vite-plugin-cesium
    },
  },
  server: {
    port: 5173,
    open: true,
      proxy: {
        '/api': {
          target: 'https://api.cesium.com',
          changeOrigin: true,
          secure: false,
        },
        '/assets': {
          target: 'https://assets.cesium.com',
          changeOrigin: true,
          secure: false,
        }
      },
      optimizeDeps: {
        exclude: ['cesium']
      },
      
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: true,
    chunkSizeWarningLimit: 3000,
  },
 
});
