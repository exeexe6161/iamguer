import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const LIMIT = 25;
const OUTPUT_REL = 'src/data/instagram-posts.json';

function appSecretProof(token, secret) {
  return createHmac('sha256', secret).update(token).digest('hex');
}

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

async function fetchInstagramMedia({ token, userId, secret }) {
  const proof = appSecretProof(token, secret);
  const url = new URL(`${GRAPH_BASE}/${userId}/media`);
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('limit', String(LIMIT));
  url.searchParams.set('access_token', token);
  url.searchParams.set('appsecret_proof', proof);

  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Graph API ${res.status}: ${text.slice(0, 300)}`);
  }
  const parsed = JSON.parse(text);
  return (parsed.data ?? []).filter((p) => p.media_url && p.permalink);
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
          const posts = await fetchInstagramMedia({ token, userId, secret });
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
            `Instagram sync OK — ${posts.length} posts written to ${OUTPUT_REL}`,
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
