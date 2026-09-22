import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

function prerenderPlugin(): Plugin {
  return {
    name: 'vite-plugin-prerender',
    apply: 'build',
    closeBundle() {
      console.log('⚡ [vite-prerender] Running generate_sitemap and prerender...');
      try {
        execSync('node scripts/generate_sitemap.js', { stdio: 'inherit' });
        execSync('node scripts/prerender.js', { stdio: 'inherit' });
        console.log('✅ [vite-prerender] Prerendering finished successfully!');
      } catch (err) {
        console.error('❌ [vite-prerender] Prerender failed:', err);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), prerenderPlugin()],
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
