# WichtelZauber – Premium Demo

Eine eigenständig gestaltete, responsive und interaktive Schweizer WichtelZauber-Shop-Vorschau.

## Starten

Öffne `index.html` direkt im Browser. Es sind keine Abhängigkeiten nötig. Für lokale Entwicklung optional `python -m http.server 8000` ausführen und `http://localhost:8000` öffnen.

## Enthalten

- Magische Startseite mit Winterhaus, Schneefall und responsivem Layout
- Basic CHF 14.90, Magic CHF 29.90, Ultimate CHF 49.90
- Interaktiver Konfigurator mit Live-Vorschau
- Warenkorb und Demo-Checkout ohne Zahlung
- Persönliche Wichtelwelt mit 24 zusammenhängenden **Textkapiteln**
- Memory-Minispiel, Wichtelpost und erkundbare Ortsvorschau
- Elternbereich-Demo und Browser-Speicherung (localStorage)

## Wichtig: Noch nicht produktionsbereit

Dies ist eine **Frontend-Demo**, kein sicherer E-Commerce-Shop. Es gibt noch keine Supabase-Anbindung, Benutzerkonten, echten Zahlungsanbieter, Webhooks, E-Mail-Versand, funktionierende QR-Codes, serverseitige Paketberechtigungen, serverseitige Adventsfreischaltung oder fertige Videos. Elternbereich und Bestellungen sind nur lokal simuliert. Weitere Magic- und Ultimate-Funktionen sind als geplant gekennzeichnet.

## Datenschutz und Sicherheit

Keine echten Kundendaten in der Demo eingeben. Das Repository ist derzeit öffentlich. Keine Secrets, API-Schlüssel oder Kundendaten committen. Für den Verkaufsstart ist eine serverseitige Architektur mit Auth, RLS, Zahlungsprüfung, Datenschutzdokumenten und Tests erforderlich.

## Nächste Schritte

1. React/TypeScript-App mit Komponenten und Routing aufsetzen.
2. Supabase-Datenmodell, Auth, RLS und Zugriffstests.
3. Sandbox-Zahlungen, signierte Webhooks, Provisionierung und E-Mail.
4. 24 originale Videofilme produzieren und Untertitel integrieren.
5. Rechtliche Prüfung und Freigabe vor öffentlichem Verkauf.
