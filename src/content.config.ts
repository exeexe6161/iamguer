import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const galerien = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galerien' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().max(200),
    cover: z.string().optional(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

const notizen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notizen' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().max(200),
    cover: z.string().optional(),
  }),
});

export const collections = { galerien, notizen };
