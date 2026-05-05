// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import instagramSync from './src/integrations/instagram-sync.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://iamguer.com',
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/preview/'),
    }),
    instagramSync(),
  ],
});