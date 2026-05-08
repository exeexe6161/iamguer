// Vercel Routing Middleware (Edge runtime).
// Runs globally before the cache for every request.
// Toggle via env var MAINTENANCE_MODE=true in Vercel project settings.

const BYPASS_PASSWORD = 'iamguer061';
const BYPASS_COOKIE = 'iamguer-bypass';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const ALLOW_LIST = new Set([
  '/coming-soon.html',          // self-served via fetch (loop guard)
  '/audio/iamguer-ambient.mp3', // ambient audio for coming-soon
  '/robots.txt',                // crawler directives
  '/favicon.ico',               // browser tab icon
]);

// HTTP status for the maintenance response.
// Switch to 200 if browsers show native error UI (e.g. Chrome's error page).
const STATUS: 503 | 200 = 503;

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return;
  }

  const url = new URL(request.url);

  if (ALLOW_LIST.has(url.pathname)) {
    return;
  }

  if (url.searchParams.get('bypass') === BYPASS_PASSWORD) {
    url.searchParams.delete('bypass');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': url.toString(),
        'Set-Cookie': `${BYPASS_COOKIE}=${BYPASS_PASSWORD}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly; Secure`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const cookie = request.headers.get('cookie') || '';
  const hasBypass = cookie
    .split(';')
    .some((c) => c.trim() === `${BYPASS_COOKIE}=${BYPASS_PASSWORD}`);
  if (hasBypass) {
    return;
  }

  // Loop-safe because /coming-soon.html is in ALLOW_LIST.
  const comingSoon = await fetch(new URL('/coming-soon.html', url.origin));
  const body = await comingSoon.text();

  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow',
  };
  if (STATUS === 503) {
    headers['Retry-After'] = '86400';
  }

  return new Response(body, {
    status: STATUS,
    headers,
  });
}
