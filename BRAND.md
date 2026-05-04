# iamguer — Markenleitfaden

## Marke
"iamguer" — Wortmarke und Bildmarke (Logo "Stamped").

## Inhaber
Hakan Güer
Marburg, Deutschland

## Stand
Erstellt: 2026-05-04
Version: 1.0

---

## Logo-Spezifikation

### Geometrie (auf 100 × 100 Canvas)
- Frame: Quadrat 60 × 60 von Position (20, 20) bis (80, 80)
- Frame-Linie: 1.5 px solid stroke
- Schriftzug "guer": Position (50, 59), text-anchor middle (zentriert)
- Coral-Punkt: Mittelpunkt (80, 80), Radius 4.5
- Punkt-Hintergrund-Block (nur dunkle Variante mit Hintergrund): 14 × 14 von (73, 73) bis (87, 87) — dient dazu, die Frame-Linie unter dem Punkt visuell zu unterbrechen

### Typographie
- Schrift: Inter Variable
- Gewicht: 300 (Light)
- Größe: 32 Einheiten (auf 100er Grid)
- Letter-Spacing: -1
- Render-Hinweis: anti-aliased

### Farben

| Element       | Hex     | RGB           | Rolle                   |
|---------------|---------|---------------|-------------------------|
| Hintergrund   | #0a0a0a | 10, 10, 10    | Canvas (warmes Schwarz) |
| Frame & Schrift | #e8e6e1 | 232, 230, 225 | Primär (warmes Weiß)    |
| Coral-Akzent  | #c08672 | 192, 134, 114 | Marken-Akzent           |

Pantone-Annäherungen (zur Information, nicht verbindlich):
- #0a0a0a ≈ Pantone Black 6 C
- #e8e6e1 ≈ Pantone Warm Grey 1 C
- #c08672 ≈ Pantone 16-1431 TPX (Peach Bloom)

### Light-Mode-Variante
Identische Geometrie und Typographie, aber:
- Frame und Schrift: #0a0a0a (statt #e8e6e1)
- Coral-Akzent unverändert: #c08672
- Hintergrund: transparent oder weiß (#ffffff)

---

## Verwendungsregeln

### Erlaubt
- Verkleinerung bis 14 × 14 px (digital), 8 × 8 mm (Print)
- Bei Größen ≤ 20 px reduzierte Variante (Frame + Coral-Punkt ohne "guer")
- Verwendung auf dunklen oder hellen Flächen mit jeweiliger Farb-Variante
- Stroke-Width proportional anpassen für sehr kleine Renderings (Beispiel: 6 px bei 14 × 14 Favicon)

### Verboten
- Frame deformieren (kein anderes Seitenverhältnis als 1:1)
- Coral-Punkt durch andere Farbe ersetzen
- Schriftzug "guer" gegen anderen Text austauschen
- Logo drehen, kippen oder spiegeln
- Frame-Linie strichlieren oder mit Effekten (Glow, Schatten) versehen
- In andere Schriftart setzen
- Coral-Punkt-Position verändern
- Buchstaben einzeln einfärben

---

## Schutzraum
Mindestens 25 % der Logo-Höhe um das Logo herum (entspricht 25 Einheiten auf 100er Grid).
Keine andere visuelle Element darf in diese Zone eindringen.

## Mindestgröße
- Digital: 14 × 14 px (mit reduzierter Variante)
- Print: 8 × 8 mm
- Bei Markenanmeldung Bildmarke: minimum 26 × 26 mm laut DPMA-Anmeldevorgabe

---

## Datei-Inventar (in `public/brand/`)

| Datei                    | Zweck                                              |
|--------------------------|----------------------------------------------------|
| favicon.svg              | Standard-Favicon, voller Logo-Inhalt mit "guer"    |
| favicon-small.svg        | Reduziert, Frame + Coral-Punkt, ohne "guer"        |
| logo-mark-dark.svg       | Transparent, dunkler Modus                          |
| logo-mark-light.svg      | Transparent, heller Modus (Print, Light-Web)       |
| logo-wordmark.svg        | Logo + "iamguer"-Schriftzug horizontal              |
| og-image-template.svg    | 1200 × 630 OG-Sharing-Vorlage (Vektor)             |
| apple-touch-icon.png     | 180 × 180 (manuell zu generieren)                   |
| icon-192.png             | 192 × 192 PWA Android                               |
| icon-512.png             | 512 × 512 PWA Android                               |
| icon-maskable.png        | 512 × 512 Maskable (Adaptive Icons)                |
| og-default.jpg           | 1200 × 630 OG JPG (manuell konvertiert)            |

In `public/`:
| Datei                    | Zweck                                              |
|--------------------------|----------------------------------------------------|
| favicon.ico              | Multi-Size ICO für ältere Browser (manuell)        |
| manifest.webmanifest     | PWA-Manifest                                        |

---

## Lizenz

Logo, Wortmarke und alle abgeleiteten Werke sind alleiniges Eigentum von Hakan Güer.

Verwendete Schriftart: Inter Variable von Rasmus Andersson, lizenziert unter SIL Open Font License (OFL) — frei kommerziell nutzbar, auch in Markenanmeldungen.

Es bestehen keine Lizenzeinschränkungen Dritter an Form, Farben oder Komposition des Logos. Alle Bestandteile (Quadrat, Linie, Kreis, Schriftzug "guer") sind elementare geometrische und typografische Bausteine ohne Drittanspruch.

---

## Markenanmeldung — Checkliste

- [ ] DPMA-Recherche durchgeführt (https://register.dpma.de/DPMAregister/marke/recherche)
- [ ] EUIPO-Recherche durchgeführt (https://euipo.europa.eu)
- [ ] WIPO Global Brand Database geprüft
- [ ] Markenklassen definiert
- [ ] Anmeldung als Wortmarke "iamguer" eingereicht
- [ ] Anmeldung als Bildmarke "Stamped Logo" eingereicht (separat oder kombiniert)
- [ ] DPMA-Aktenzeichen erhalten
- [ ] Eintragungsnummer erhalten
- [ ] Eintragungsurkunde archiviert

### Vorgeschlagene Markenklassen (Nizza-Klassifikation, vor Anmeldung mit Anwalt prüfen)

| Klasse | Beschreibung                                      | Relevanz                                |
|--------|---------------------------------------------------|------------------------------------------|
| 41     | Erziehung, Ausbildung, Unterhaltung, Sport, Kultur | Photographie-Dienstleistungen            |
| 16     | Druckerzeugnisse, Fotografien                     | Falls Print-Verkauf geplant              |
| 9      | Software, mobile Apps                             | Im Hinblick auf zukünftige Apps          |

---

## Versionierung

| Version | Datum       | Änderung                          |
|---------|-------------|------------------------------------|
| 1.0     | 2026-05-04  | Initial-Erstellung der Marke       |
