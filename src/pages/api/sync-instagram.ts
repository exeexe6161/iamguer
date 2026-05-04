import type { APIRoute } from 'astro';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const LIMIT = 25;

type IGPost = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type SyncResult = {
  ok: boolean;
  fetchedAt: string;
  count: number;
  posts: IGPost[];
  writtenTo: string[];
  warnings: string[];
};

function appSecretProof(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function tryWrite(filepath: string, data: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, data, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async () => {
  const token = process.env.IG_TOKEN;
  const secret = process.env.IG_APP_SECRET;
  const userId = process.env.IG_USER_ID;
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;

  const warnings: string[] = [];

  if (!token || !secret || !userId) {
    return jsonResponse(
      {
        ok: false,
        error:
          'Missing env vars. Required: IG_TOKEN, IG_APP_SECRET, IG_USER_ID.',
      },
      500,
    );
  }

  const proof = appSecretProof(token, secret);
  const url = new URL(`${GRAPH_BASE}/${userId}/media`);
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('limit', String(LIMIT));
  url.searchParams.set('access_token', token);
  url.searchParams.set('appsecret_proof', proof);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { accept: 'application/json' },
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: 'Network error', detail: String(err) },
      502,
    );
  }

  const bodyText = await res.text();
  if (!res.ok) {
    return jsonResponse(
      {
        ok: false,
        error: `Graph API ${res.status}`,
        detail: bodyText.slice(0, 1000),
      },
      res.status,
    );
  }

  let parsed: { data?: IGPost[] };
  try {
    parsed = JSON.parse(bodyText);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: 'Invalid JSON from Graph API', detail: String(err) },
      502,
    );
  }

  const posts: IGPost[] = (parsed.data ?? []).filter(
    (p) => p.media_url && p.permalink,
  );

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: '@iamguer',
    count: posts.length,
    posts,
  };
  const serialized = JSON.stringify(payload, null, 2);

  const writtenTo: string[] = [];
  const repoPath = path.resolve(process.cwd(), 'src/data/instagram-posts.json');
  if (await tryWrite(repoPath, serialized)) writtenTo.push(repoPath);
  const tmpPath = '/tmp/instagram-posts.json';
  if (await tryWrite(tmpPath, serialized)) writtenTo.push(tmpPath);

  if (writtenTo.length === 0) {
    warnings.push('Could not persist JSON to filesystem.');
  }

  if (deployHook) {
    try {
      const hookRes = await fetch(deployHook, { method: 'POST' });
      if (!hookRes.ok) {
        warnings.push(`Deploy hook returned ${hookRes.status}`);
      }
    } catch (err) {
      warnings.push(`Deploy hook error: ${String(err)}`);
    }
  } else {
    warnings.push(
      'VERCEL_DEPLOY_HOOK_URL not set — deployed static site will not pick up new posts until a manual rebuild.',
    );
  }

  warnings.push(
    'Token refresh is not automated (no IG_APP_ID configured). Long-lived IG tokens expire after 60 days — check Vercel logs and rotate IG_TOKEN manually before expiry.',
  );

  const result: SyncResult = {
    ok: true,
    fetchedAt: payload.fetchedAt,
    count: posts.length,
    posts,
    writtenTo,
    warnings,
  };

  return jsonResponse(result, 200);
};
