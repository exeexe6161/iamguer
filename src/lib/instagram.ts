import fs from 'node:fs';
import path from 'node:path';

export type IGPost = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

export type IGPayload = {
  fetchedAt: string;
  source: string;
  count: number;
  posts: IGPost[];
};

export function loadInstagramPosts(): IGPayload | null {
  const filePath = path.resolve(
    process.cwd(),
    'src/data/instagram-posts.json',
  );
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as IGPayload;
    if (!Array.isArray(parsed.posts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function displaySrc(post: IGPost): string {
  if (post.media_type === 'VIDEO' && post.thumbnail_url) {
    return post.thumbnail_url;
  }
  return post.media_url;
}

export function shortCaption(caption: string | undefined, max = 140): string {
  if (!caption) return '';
  const cleaned = caption.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).trimEnd() + '…';
}
