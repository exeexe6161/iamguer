import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchAllInstagramMedia } from '../../lib/fetch-instagram-media.mjs';

export const prerender = false;

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

async function readExistingCount(filepath: string): Promise<number> {
  try {
    const raw = await fs.readFile(filepath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.posts) ? parsed.posts.length : 0;
  } catch {
    return 0;
  }
}

export const GET: APIRoute = async () => {
  const token = process.env.IG_TOKEN;
  const secret = process.env.IG_APP_SECRET;
  const userId = process.env.IG_USER_ID;
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;

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

  const warnings: string[] = [];
  const repoPath = path.resolve(process.cwd(), 'src/data/instagram-posts.json');
  const tmpPath = '/tmp/instagram-posts.json';

  let posts;
  let calls;
  let truncated;
  try {
    const result = await fetchAllInstagramMedia({ token, userId, secret });
    posts = result.posts;
    calls = result.calls;
    truncated = result.truncated;
    warnings.push(...result.warnings);
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: 'Instagram fetch failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      502,
    );
  }

  if (posts.length === 0) {
    const existing = await readExistingCount(repoPath);
    if (existing > 0) {
      warnings.push(
        `Instagram returned 0 posts; existing JSON (${existing}) preserved — not overwriting.`,
      );
      return jsonResponse(
        {
          ok: true,
          fetchedAt: new Date().toISOString(),
          count: 0,
          calls,
          truncated,
          posts: [],
          writtenTo: [],
          warnings,
        },
        200,
      );
    }
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: '@iamguer',
    count: posts.length,
    posts,
  };
  const serialized = JSON.stringify(payload, null, 2);

  const writtenTo: string[] = [];
  if (await tryWrite(repoPath, serialized)) writtenTo.push(repoPath);
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

  return jsonResponse(
    {
      ok: true,
      fetchedAt: payload.fetchedAt,
      count: posts.length,
      calls,
      truncated,
      posts,
      writtenTo,
      warnings,
    },
    200,
  );
};
