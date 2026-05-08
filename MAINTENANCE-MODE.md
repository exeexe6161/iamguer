# Maintenance Mode

Coming-Soon-Page mit Bypass-Mechanismus für www.iamguer.com.
Implementiert als Vercel Routing Middleware (Edge), die jeden Request
abfängt bevor er zur statischen Site geroutet wird.

## Architektur

- `middleware.ts` (Repo-Root) — Vercel Edge Middleware, läuft vor jedem Request
- `public/coming-soon.html` — self-contained HTML, 0 externe Abhängigkeiten
- ENV-Variable `MAINTENANCE_MODE` — schaltet das Gate an/aus

Wenn `MAINTENANCE_MODE=true`: Jeder Request → Coming-Soon-HTML, außer:
- Pfade in der ALLOW_LIST (Audio, robots.txt, favicon, coming-soon selbst)
- Requests mit gültigem Bypass-Cookie

Wenn `MAINTENANCE_MODE` nicht gesetzt oder ≠ `true`: Middleware ist
transparent, echte Site wird ausgeliefert (kein User-Impact, minimaler
Edge-Function-Invoke pro Request).

## Aktivieren

**Production (Vercel Dashboard):**
1. Project → Settings → Environment Variables
2. Neue Variable: `MAINTENANCE_MODE` = `true` (Scope: Production)
3. Vercel deployed automatisch neu (oder Redeploy triggern)
4. Live-Verifikation: `https://iamguer.com` → Coming-Soon erscheint

**Lokal (`vercel dev`):**
1. `.env.local` im Repo-Root anlegen mit: `MAINTENANCE_MODE=true`
2. `npx vercel dev` starten
3. `http://localhost:3000` → Coming-Soon

## Deaktivieren

**Production:**
- Vercel Dashboard → ENV-Variable `MAINTENANCE_MODE` löschen oder auf
  `false` setzen
- Redeploy (oder einfach abwarten — neuer Deploy greift dann den neuen Wert)

**Lokal:**
- `.env.local` Variable entfernen oder auf `false` setzen

## Bypass

URL: `https://iamguer.com?bypass=iamguer061`

Beim Aufruf:
1. Middleware setzt Cookie `iamguer-bypass=iamguer061`
   (HttpOnly, Secure, SameSite=Lax, 30 Tage)
2. Redirect (302) auf URL ohne `?bypass` Parameter
3. Folge-Requests sehen das Cookie → echte Site wird geliefert
4. Cookie ist domain-weit (Path=/) — gilt für alle Pfade

Cookie-Lifetime: 30 Tage. Danach erneuter Bypass nötig.
Cookie löschen: Browser-DevTools → Application → Cookies →
`iamguer-bypass` löschen.

## ALLOW_LIST (immer durchgereicht, auch ohne Bypass)

| Pfad | Grund |
|---|---|
| `/coming-soon.html` | Selbst-Anlieferung via Fetch (Loop-Schutz) |
| `/audio/iamguer-ambient.mp3` | Ambient-Audio im Coming-Soon |
| `/robots.txt` | Crawler-Anweisungen (sonst HTML statt robots-Syntax) |
| `/favicon.ico` | Browser-Tab-Icon |

## Lokales Testen

**A) HTML-only (sofort, ohne Vercel-CLI):**
```sh
npm run dev
# → http://localhost:4321/coming-soon.html
```
Testet: Layout, Animationen, Audio, Countdown, Sprachen, Themes.
Testet **nicht**: Bypass-Mechanismus, Status-Codes, Cookie-Logik.

**B) Voll-Test mit Middleware (`vercel dev`):**
```sh
echo "MAINTENANCE_MODE=true" > .env.local
npx vercel dev
# → http://localhost:3000
```
Testet alles: Coming-Soon-Gate, Bypass-Cookie, Allow-List, Status-Code.

## HTTP-Status

Default: `503 Service Unavailable` mit `Retry-After: 86400` (1 Tag).
Semantisch korrekt für Maintenance, signalisiert Crawlern "kommt später wieder".

Falls Browser native Error-UI zeigen (Chrome zeigt manchmal ein
"Diese Seite ist nicht erreichbar"-Banner bei 503), in `middleware.ts`
die Status-Konstante umstellen:
```ts
const STATUS: 503 | 200 = 200;
```

Beide Varianten setzen `X-Robots-Tag: noindex, nofollow` als Header.
Zusätzlich `<meta name="robots" content="noindex,nofollow">` in der HTML
(defense in depth gegen Indexierung).

## DSGVO

- **Bypass-Cookie** ist funktional (technisch notwendig zum Login),
  keine Einwilligung nötig
- Rechtsgrundlage: Art. 6 (1) (f) DSGVO + § 25 (2) Nr. 2 TTDSG
- Coming-Soon-HTML lädt **keine** externen Ressourcen
  (kein Google Fonts, kein CDN, keine Tracker)
- Audio (`iamguer-ambient.mp3`) liegt auf eigener Domain

## Nach dem Launch — Cleanup-Optionen

### Option 1 — Maintenance-Infrastruktur behalten

- ENV-Variable `MAINTENANCE_MODE` aus Vercel löschen (oder auf `false`)
- `middleware.ts`, `public/coming-soon.html`, `MAINTENANCE-MODE.md`
  bleiben im Repo
- Bei nächstem Maintenance-Bedarf: nur ENV-Var auf `true` setzen
- **Empfohlen** wenn künftige Wartungsarbeiten geplant sind
- Trade-off: Middleware läuft als No-Op pro Request (minimal Edge-Compute)

### Option 2 — komplett entfernen

- ENV-Variable `MAINTENANCE_MODE` aus Vercel entfernen
- Im Repo:
  ```sh
  git rm middleware.ts public/coming-soon.html MAINTENANCE-MODE.md
  ```
- Commit: `remove maintenance mode infrastructure`
- Trade-off: bei nächster Maintenance muss alles neu aufgesetzt werden

### Bypass-Cookies auf eigenen Devices

- Laufen automatisch nach 30 Tagen aus — kein Issue, keine Aktion nötig
- Optional manuell löschen: Browser-DevTools → Application → Cookies

## Sicherheitshinweise

- Bypass-Passwort `iamguer061` steht im Klartext in `middleware.ts`
  und in dieser Doku
- Repo ist privat (GitHub `exeexe6161/iamguer`) — Passwort nicht öffentlich
- Bei Repo-Public-Schaltung: Passwort vor Push rotieren
- Cookie ist `HttpOnly` + `Secure` → kein XSS-Diebstahl,
  nur HTTPS-Übertragung
