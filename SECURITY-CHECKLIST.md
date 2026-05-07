# iamguer.com — Security Checklist

Letzter Stand: 2026-05  
Nächste Review: 2026-11

---

## ✅ Implementiert (Code)

### HTTP-Security-Header (vercel.json)
- Strict-Transport-Security (HSTS) — 2 Jahre, includeSubDomains, preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN  
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: 27 Features blockiert (Kamera, Mikro, USB, etc.)
- Cross-Origin-Opener-Policy: same-origin
- Content-Security-Policy: default-src 'self', spezifische Whitelists für Fonts + Instagram-CDN
- Cache-Control: HTML revalidate, Assets 1 Jahr immutable, Fonts 30 Tage

### Frontend-Bildschutz
- .photo-protected CSS-Klasse (tokens.css) — disable user-select, drag, touch-callout
- Globaler contextmenu-Listener in BaseLayout.astro — verhindert Right-Click auf .photo-protected
- 4 Foto-<img>-Patterns geschützt: Hero, Hero-Card-Thumb, Bento-Grid (auf Home pro Sprache) + Instagram-Feed (auf Galerien-Seiten)
- 10 Source-Code-Edits (3× index.astro für DE/EN/TR à 3 imgs + 1× InstagramGallery.astro)
- Gerendert: 14 imgs pro Home-Seite + 13 imgs pro Galerien-Seite, alle mit class="photo-protected" + draggable="false"
- BrandMark/ThemeSwitcher/Icons UNGESCHÜTZT (sind keine Fotos)

### AI-Bot-Blocking (robots.txt)
- 30 explizit blockierte Bots (AI-Training + aggressive Scraper)
- Suchmaschinen (Googlebot regulär, Bingbot, DuckDuckGoBot) bleiben erlaubt
- Sitemap-Verweis erhalten

---

## 🔧 Manuell zu prüfen (regelmäßig)

### Vercel Dashboard
- [ ] Vercel Firewall — Pro-Plan? Custom Rules für Bot-Patterns einrichten
- [ ] Vercel Analytics-Settings prüfen (aktuell NICHT aktiv)
- [ ] Domain Settings → SSL erzwungen (sollte default sein)
- [ ] Deployment Protection für Preview-Environments aktivieren

### Domain-Registrar
- [ ] 2FA für Account aktiviert
- [ ] Domain-Lock aktiviert (verhindert Transfer)
- [ ] WHOIS-Privacy aktiv
- [ ] DNS-Records via DNSSEC wenn möglich

---

## 📋 TODOs

### KRITISCH (vor nächstem Production-Deploy klären)

- [ ] Instagram-Sync vor Deploy triggern
  Aktuell sind in src/data/instagram-posts.json Unsplash-URLs (Fixture).
  In Production werden die durch echte scontent.cdninstagram.com-URLs 
  ersetzt durch den Cron um 18:00 UTC. Vor erstem Deploy nach 
  Security-Härtung: Cron einmal manuell triggern oder bis 18:00 warten,
  damit instagram-posts.json echte URLs enthält. Sonst werden 
  Fixture-Bilder durch CSP geblockt.

### WICHTIG

- [ ] Galerie-Detail-Seiten ([slug].astro) prüfen
  Falls dort später Foto-<img>-Tags hinzukommen (z.B. inline Markdown-
  Bilder), müssen sie .photo-protected CSS-Klasse + draggable="false" 
  bekommen. Aktuell scheinen keine Bilder drin zu sein.

- [ ] Instagram-CDN-Migration erwägen
  Derzeit werden Bilder direkt von scontent.cdninstagram.com geladen.
  Probleme:
  - Instagram rotiert URLs alle paar Tage/Wochen → 404-Risiko
  - Kein eigener CDN-Cache → Performance abhängig von Instagram
  - DSGVO-Schwachpunkt: jeder Besucher schickt Request an Meta-Server 
    ohne Consent
  - Instagram kann Hotlinking jederzeit blocken
  
  Geplante Lösung:
  1. Instagram-Sync-Build-Step erweitern: Bilder einmal vom CDN ziehen, 
     in src/assets/instagram/ speichern
  2. Astro <Image /> Component für automatische Optimierung nutzen
  3. Vercel CDN serviert lokale Bilder weltweit cached
  4. CSP entsprechend tightenen (img-src 'self' data: blob: nur, ohne 
     Instagram-Domains)

- [ ] /api/sync-instagram Endpoint absichern
  Aktuell hat der Cron-Endpoint KEINE Auth-Prüfung. Anyone kann ihn 
  aufrufen — Schutz nur durch:
  - Required ENV-Vars (IG_TOKEN, IG_APP_SECRET, IG_USER_ID) müssen 
    gesetzt sein
  - URL ist nicht öffentlich beworben
  
  Empfohlene Härtung:
  1. CRON_SECRET in Vercel-ENV setzen
  2. Endpoint prüft Authorization-Header gegen process.env.CRON_SECRET
  3. Vercel-Cron schickt diesen Header automatisch wenn konfiguriert
  
  Siehe: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  
  Risiko aktuell: Ein Angreifer könnte den Endpoint repeatedly 
  aufrufen → Instagram-API-Rate-Limits triggern → Token könnte 
  blockiert werden. Niedrige Wahrscheinlichkeit, aber vermeidbar.

- [ ] IG_TOKEN-Refresh-Strategie dokumentieren
  Long-lived Token läuft alle 60 Tage ab. Vercel-ENV muss manuell 
  aktualisiert werden, sonst bricht Sync.
  
  Auto-Refresh-Logik wäre sinnvoll — Meta Graph API hat einen 
  Endpoint dafür. Bis dahin: Reminder im Kalender alle 50 Tage.

### NICE TO HAVE

- [ ] EXIF-Daten in Foto-Originals setzen
  Vor Upload mit exiftool Copyright-Info schreiben:
  exiftool -Copyright="© iamguer 2026" -Artist="iamguer" *.jpg
  Verhindert nicht Theft, aber dokumentiert Urheberschaft.

- [ ] Watermark erwägen
  Dezenter "© iamguer" Text unten rechts auf jedem Foto schreckt mehr 
  ab als jeder Code. Kann via Astro-Image-Pipeline automatisch 
  hinzugefügt werden.

- [ ] Impressum prüfen (§5 TMG)
  Pflicht in Deutschland — falls noch nicht vorhanden auf der Seite.

- [ ] Datenschutzerklärung prüfen
  Mit Verweis auf Instagram-Hotlinking + Google Fonts (JetBrains Mono).
  Falls Cookie-Consent-Banner gewünscht, separates Projekt.

---

## ⚖️ Trade-offs (bewusste Entscheidungen)

### CSP 'unsafe-inline' für script-src
Astro mit output: 'static' kann keine Nonces dynamisch injizieren. 
'unsafe-inline' ist die einzige praktische Option für die is:inline-
Skripte (Theme-Detection, Sprach-Redirect, Splash-Handler).

Trade-off bewusst akzeptiert — Inline-Scripts sind alle vom eigenen 
Code. Wenn später strict-CSP gewünscht: Migration auf Build-Time-
Hashes oder Nonce via SSR.

### COEP nicht gesetzt
Cross-Origin-Embedder-Policy mit credentialless wäre strenger, aber 
würde Instagram-CDN-Bilder potenziell brechen. Trade-off: Brauchbarkeit 
> maximale Strenge. Vorteile von COEP (SharedArrayBuffer, High-Res-
Timer) sind für eine Foto-Site nicht nötig.

### Right-Click-Disable nur Frontend
Right-Click + Drag + Touch-Callout abfangen via JavaScript ist 
psychologische Hürde. Wer Screenshots macht oder DevTools öffnet, 
kommt trotzdem an Bilder. Aber 95% der Casual-Klauer werden 
abgeschreckt.

### Bot-Blocking via robots.txt nicht rechtsverbindlich
robots.txt ist eine höfliche Bitte. Anthropic, OpenAI, Google, Apple 
halten sich tendenziell dran. Andere ignorieren es komplett. 
Echte Blockade nur via Vercel-Firewall (Pro-Plan) oder Cloudflare.

---

## 🔄 Pflege-Schedule

### Alle 6 Monate
- [ ] AI-Bot-Liste in robots.txt aktualisieren
  Tracker: https://darkvisitors.com/agents
- [ ] CSP-Header prüfen (neue Third-Party-Domains?)
- [ ] Permissions-Policy auf neue Browser-APIs prüfen

### Alle 12 Monate  
- [ ] Vercel.json gegen aktuelle Best-Practices prüfen
- [ ] Online-Security-Tests neu ausführen (siehe unten)
- [ ] HSTS-Preload-Status auf https://hstspreload.org prüfen

---

## 🧪 Online-Tests nach Production-Deploy

Nach jedem größeren Security-Update folgende Tests durchführen:

| Service | URL | Ziel |
|---------|-----|------|
| Security Headers | https://securityheaders.com | A oder A+ |
| Mozilla Observatory | https://observatory.mozilla.org | A |
| SSL Labs | https://www.ssllabs.com/ssltest | A+ |
| CSP Evaluator | https://csp-evaluator.withgoogle.com | minimale Findings |

---

## 💡 Empfehlungen für später

### Vercel Pro-Plan ($20/Monat)
Falls iamguer.com kommerziell ausbaut (Foto-Buchungen, Kunden-
Kontakte), Pro-Plan lohnt sich für:
- Web Application Firewall (WAF)
- Custom Bot-Patterns
- Rate-Limiting für /api/* Endpoints
- IP-Blocking
- Erweiterte DDoS-Mitigation

### Cloudflare als zusätzliche Schicht
Für maximale Bot-Abwehr Cloudflare vor Vercel schalten:
- Bot Fight Mode
- Challenge-Pages für verdächtige Requests
- Cache-Layer für statische Assets

Ist aber Overkill für eine private Foto-Seite.

### CMS-Migration
Falls Bilder häufig hochgeladen werden, Foto-CMS erwägen:
- Cloudinary (Image-CDN mit DRM)
- Imgix (Watermarking, Transformations)
- Eigener S3-Bucket + Vercel Image-Optimization

---

## 📞 Kontakt bei Sicherheitsvorfall

[Hakan Guer / iamguer]
- Vercel Dashboard direkt prüfen
- Domain-Registrar Login bereit halten
- DNS-Notfall: TTL niedrig halten für schnelle Switches
