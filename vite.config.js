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
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        globals: {
          cesium: 'Cesium', // Defines global variable for Cesium (for non-ES builds)
        },
      },
    },
  },
  optimizeDeps: {
    include: ['cesium'], // Pre-bundles Cesium for performance
  },
});
