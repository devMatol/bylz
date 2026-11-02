import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PLANS_DATA } from './src/lib/plansData';

function jsonLdPlugin(): Plugin {
  return {
    name: 'vite-plugin-jsonld',
    transformIndexHtml(html) {
      const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Logiciel de facturation et de gestion des cotisations URSSAF pour auto-entrepreneurs et micro-entreprises.",
        "offers": [
          {
            "@type": "Offer",
            "name": PLANS_DATA.starter.name,
            "price": PLANS_DATA.starter.pricing.monthlyPrice.toFixed(2),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": validUntil,
            "url": "https://bylz.fr/tarifs"
          },
          {
            "@type": "Offer",
            "name": PLANS_DATA.solo.name,
            "price": PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": validUntil,
            "url": "https://bylz.fr/tarifs"
          },
          {
            "@type": "Offer",
            "name": PLANS_DATA.pro.name,
            "price": PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": validUntil,
            "url": "https://bylz.fr/tarifs"
          }
        ]
      };
      const jsonLdTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
      return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLdTag);
    },
  };
}

function prerenderPlugin(): Plugin {
  return {
    name: 'vite-plugin-prerender',
    apply: 'build',
    closeBundle() {
      console.log('⚡ [vite-prerender] Running generate_sitemap and prerender...');
      try {
        execSync('npx tsx scripts/generate_sitemap.js', { stdio: 'inherit' });
        execSync('npx tsx scripts/prerender.js', { stdio: 'inherit' });
        console.log('✅ [vite-prerender] Prerendering finished successfully!');
      } catch (err) {
        console.error('❌ [vite-prerender] Prerender failed:', err);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jsonLdPlugin(), prerenderPlugin()],
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
