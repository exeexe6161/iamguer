import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

type ContactType = 'general' | 'sponsor' | 'collaboration' | 'photo';

const typeLabels: Record<ContactType, string> = {
  general: 'Normale Anfrage',
  sponsor: 'Sponsor / Brand Anfrage',
  collaboration: 'Kooperation',
  photo: 'Bildnutzung / Rechte',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function clean(value: unknown, max = 3000): string {
  return String(value ?? '').trim().slice(0, max);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;

  try {
    body = await readBody(request);
  } catch {
    return json({ ok: false, error: 'Ungültige Anfrage.' }, 400);
  }

  if (clean(body.website, 200)) {
    return json({ ok: true, message: 'Danke, deine Nachricht wurde gesendet.' });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const handle = clean(body.handle, 160);
  const message = clean(body.message, 3000);
  const lang = clean(body.lang, 8) || 'de';
  const type = clean(body.type, 40) as ContactType;
  const privacy = clean(body.privacy, 20);

  if (!name || name.length < 2) return json({ ok: false, error: 'Bitte gib deinen Namen ein.' }, 400);
  if (!email || !isValidEmail(email)) return json({ ok: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, 400);
  if (!message || message.length < 10) return json({ ok: false, error: 'Bitte schreib eine kurze Nachricht.' }, 400);
  if (!privacy) return json({ ok: false, error: 'Bitte bestätige den Datenschutzhinweis.' }, 400);

  const safeType: ContactType = type in typeLabels ? type : 'general';

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({ ok: false, error: 'Der Mailversand ist noch nicht eingerichtet.' }, 503);
  }

  const resend = new Resend(apiKey);
  const to = process.env.CONTACT_TO_EMAIL ?? 'hello@iamguer.com';
  const from = process.env.CONTACT_FROM_EMAIL ?? 'IAMGUER <onboarding@resend.dev>';

  const subject = `iamguer.com — ${typeLabels[safeType]}`;
  const receivedAt = new Date().toLocaleString('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  });

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#181614">
      <p style="color:#8a8178;text-transform:uppercase;letter-spacing:.14em;font-size:12px">iamguer.com Kontakt</p>
      <h1 style="font-size:24px;margin:0 0 24px">${escapeHtml(typeLabels[safeType])}</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Profil / Website:</strong> ${escapeHtml(handle || '-')}</p>
      <p><strong>Sprache:</strong> ${escapeHtml(lang)}</p>
      <p><strong>Zeit:</strong> ${escapeHtml(receivedAt)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
      <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</p>
    </div>
  `;

  const text = [
    'iamguer.com Kontakt',
    '',
    `Typ: ${typeLabels[safeType]}`,
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Profil / Website: ${handle || '-'}`,
    `Sprache: ${lang}`,
    `Zeit: ${receivedAt}`,
    '',
    message,
  ].join('\n');

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
    replyTo: email,
  });

  if (error) {
    return json({ ok: false, error: 'Die Nachricht konnte gerade nicht gesendet werden.' }, 502);
  }

  return json({ ok: true, message: 'Danke, deine Nachricht wurde gesendet.' });
};
