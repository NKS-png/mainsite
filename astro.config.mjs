// @ts-check
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  integrations: [solidJs()],
});
