import { createHmac } from 'node:crypto';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const PER_CALL = 100;
const MAX_POSTS = 500;
const MAX_CALLS = 10;

/**
 * @typedef {{
 *   id: string;
 *   caption?: string;
 *   media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
 *   media_url: string;
 *   thumbnail_url?: string;
 *   permalink: string;
 *   timestamp: string;
 * }} IGPost
 */

/**
 * @typedef {{
 *   posts: IGPost[];
 *   calls: number;
 *   warnings: string[];
 *   truncated: boolean;
 * }} FetchResult
 */

/**
 * @param {string} token
 * @param {string} secret
 * @returns {string}
 */
export function appSecretProof(token, secret) {
  return createHmac('sha256', secret).update(token).digest('hex');
}

/**
 * Fetches Instagram posts via Graph API, paginating until exhausted or hitting
 * safety limits (MAX_POSTS=500, MAX_CALLS=10, PER_CALL=100). On the FIRST
 * call's failure, throws — no partial data to keep. On a LATER call's
 * failure, keeps what's been collected and stops with a warning.
 *
 * @param {{ token: string; userId: string; secret: string }} args
 * @returns {Promise<FetchResult>}
 */
export async function fetchAllInstagramMedia({ token, userId, secret }) {
  const proof = appSecretProof(token, secret);
  /** @type {IGPost[]} */
  const collected = [];
  /** @type {string[]} */
  const warnings = [];
  /** @type {string | null} */
  let after = null;
  let calls = 0;
  let truncated = false;

  while (calls < MAX_CALLS && collected.length < MAX_POSTS) {
    const url = new URL(`${GRAPH_BASE}/${userId}/media`);
    url.searchParams.set('fields', FIELDS);
    url.searchParams.set('limit', String(PER_CALL));
    url.searchParams.set('access_token', token);
    url.searchParams.set('appsecret_proof', proof);
    if (after) url.searchParams.set('after', after);

    let res;
    try {
      res = await fetch(url.toString(), {
        headers: { accept: 'application/json' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (calls === 0) throw new Error(`Network error: ${msg}`);
      warnings.push(`Network error on call ${calls + 1}: ${msg}`);
      break;
    }

    const text = await res.text();
    if (!res.ok) {
      if (calls === 0) {
        throw new Error(`Graph API ${res.status}: ${text.slice(0, 300)}`);
      }
      warnings.push(
        `Graph API ${res.status} on call ${calls + 1}: ${text.slice(0, 200)}`,
      );
      break;
    }

    /** @type {{ data?: IGPost[]; paging?: { cursors?: { after?: string }; next?: string } }} */
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (calls === 0) throw new Error(`Invalid JSON: ${msg}`);
      warnings.push(`Invalid JSON on call ${calls + 1}: ${msg}`);
      break;
    }

    const batch = (parsed.data ?? []).filter((p) => p.media_url && p.permalink);
    collected.push(...batch);
    calls++;

    after = parsed.paging?.cursors?.after ?? null;
    const hasNext = Boolean(parsed.paging?.next) && Boolean(after);
    if (!hasNext) break;

    if (collected.length >= MAX_POSTS) {
      truncated = true;
      warnings.push(
        `Reached MAX_POSTS=${MAX_POSTS} safety limit; stopping pagination.`,
      );
      break;
    }
    if (calls >= MAX_CALLS) {
      truncated = true;
      warnings.push(
        `Reached MAX_CALLS=${MAX_CALLS} safety limit; stopping pagination.`,
      );
      break;
    }
  }

  return { posts: collected, calls, warnings, truncated };
}
