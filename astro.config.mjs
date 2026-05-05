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
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'tr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: {
          de: 'de-DE',
          en: 'en-GB',
          tr: 'tr-TR',
        },
      },
    }),
    instagramSync(),
  ],
});