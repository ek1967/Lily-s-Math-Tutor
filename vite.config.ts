import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// base: GitHub Pages serves this from /Lily-s-Math-Tutor/. Without the prefix every
// asset 404s and the app renders a white screen that looks exactly like a code bug.

/**
 * The production CSP forbids inline scripts, which is exactly what Vite's dev
 * server injects for HMR and React Fast Refresh. Strip the meta tag while
 * serving so `npm run dev` works, and keep it in every built artefact.
 */
function cspOnlyInBuild(isBuild: boolean): Plugin {
  return {
    name: 'csp-only-in-build',
    transformIndexHtml(html) {
      if (isBuild) return html;
      return html.replace(/\s*<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, '');
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Lily-s-Math-Tutor/' : '/',
  plugins: [react(), cspOnlyInBuild(command === 'build')],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    target: 'es2022',
    // The main chunk carries the whole curriculum, every generator and every
    // lesson — the content that makes the app work offline. KaTeX, the
    // Anthropic SDK and pdf.js are all split out and load on demand, which is
    // the split that actually matters for the daily path.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          katex: ['katex'],
          anthropic: ['@anthropic-ai/sdk'],
          // pdfjs is deliberately absent: it must stay a lazy dynamic import.
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
}));
