import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'pdf-lib': fileURLToPath(new URL('node_modules/pdf-lib/es/index.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['pdf-lib'],
  },
});
