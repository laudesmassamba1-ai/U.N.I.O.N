import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { handleApiRequest } from './server/api';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'https://laudesmassamba1-ai.github.io/U.N.I.O.N').replace(/\/$/, '');
  return {
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml(html) {
        return html.replaceAll('__SITE_URL__', siteUrl);
      },
    },
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const handled = await handleApiRequest(req, res);
            if (!handled) next();
          } catch (e) {
            next(e);
          }
        });
      },
    },
  ],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '.') },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  };
});
