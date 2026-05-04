import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchAllInstagramMedia } from '../lib/fetch-instagram-media.mjs';

const OUTPUT_REL = 'src/data/instagram-posts.json';

async function loadDotEnvLocalIfNeeded() {
  if (process.env.IG_TOKEN) return;
  const envPath = path.resolve(process.cwd(), '.env.local');
  let content;
  try {
    content = await fs.readFile(envPath, 'utf-8');
  } catch {
    return;
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function readExistingCount(outputPath) {
  try {
    const raw = await fs.readFile(outputPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.posts) ? parsed.posts.length : 0;
  } catch {
    return 0;
  }
}

export default function instagramSync() {
  return {
    name: 'instagram-sync',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        await loadDotEnvLocalIfNeeded();

        const token = process.env.IG_TOKEN;
        const userId = process.env.IG_USER_ID;
        const secret = process.env.IG_APP_SECRET;

        if (!token || !userId || !secret) {
          logger.warn(
            'Instagram sync skipped — missing IG_TOKEN / IG_USER_ID / IG_APP_SECRET. Build will use existing src/data/instagram-posts.json or fall back to placeholder.',
          );
          return;
        }

        const outputPath = path.resolve(process.cwd(), OUTPUT_REL);

        try {
          const { posts, calls, warnings, truncated } =
            await fetchAllInstagramMedia({ token, userId, secret });

          for (const w of warnings) logger.warn(w);

          if (posts.length === 0) {
            const existing = await readExistingCount(outputPath);
            if (existing > 0) {
              logger.warn(
                `Instagram returned 0 posts but existing JSON has ${existing} — keeping existing data.`,
              );
            } else {
              logger.warn(
                'Instagram returned 0 posts and no existing JSON — site will show placeholder.',
              );
            }
            return;
          }

          const payload = {
            fetchedAt: new Date().toISOString(),
            source: '@iamguer',
            count: posts.length,
            posts,
          };
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(
            outputPath,
            JSON.stringify(payload, null, 2),
            'utf-8',
          );
          logger.info(
            `Instagram sync OK — ${posts.length} posts written via ${calls} API call(s)${truncated ? ' (truncated at safety limit)' : ''}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn(`Instagram sync failed: ${msg}`);
          logger.warn(
            'Build will continue without fresh Instagram data. Common cause: expired IG_TOKEN — rotate via Graph API Explorer.',
          );
        }
      },
    },
  };
}
