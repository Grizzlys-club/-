# WichtelZauber: Weg zum echten Verkauf

## Aktueller Stand
Die öffentliche HTML-Version ist ein funktionierender **Demo-Prototyp**, kein verkaufsfertiges Produkt. Sie speichert Bestellungen lokal und zeigt keine echten Videos.

## Sichere Backend-Grundlage
`supabase/migrations/20261110_initial.sql` enthält Tabellen für Produkte, Familien, Bestellungen, Welten, Episoden, Fortschritt und Wichtelpost mit RLS. Diese Migration ist vorbereitet, **nicht** in einer Supabase-Instanz ausgeführt oder getestet.

## Für einen echten Verkauf noch erforderlich
1. Supabase-Projekt verbinden, Migration anwenden und Zugriffstests durchführen.
2. Sichere Registrierung und Anmeldung sowie Passwort-Reset.
3. Zahlungsanbieter mit Schweizer Zahlungsmethoden auswählen und Sandbox einrichten.
4. Serverseitige Checkout-Session mit Preisprüfung, signiertem Webhook und idempotenter Bestellfreischaltung.
5. Individuelle Welten, private Einladungslinks und QR-Codes erzeugen.
6. E-Mails über einen konfigurierten Dienst versenden.
7. 24 **produzierte** Videofolgen, Untertitel und Streaming einbinden.
8. Altersgerechte Freischaltung am richtigen Datum serverseitig durchsetzen.
9. Magic-/Ultimate-Funktionen vollständig entwickeln und testen.
10. Impressum, Datenschutz, AGB, Widerruf/Rückgabe und Schweizer Jugendschutz/Datenschutz rechtlich prüfen.
11. Automatisierte Tests, Sicherheitstests und Backup/Monitoring.
12. Vor Live-Schaltung echte Zahlung und Rückerstattung im Testmodus durchspielen.

## Sicherheitsregeln
- Niemals Supabase service-role, Payment-Secret oder Mail-API-Key in GitHub oder Client-Code committen.
- Keine Zahlungsbestätigung aus dem Browser akzeptieren.
- Keine persönlichen Daten von Kindern ohne angemessene Schutzmassnahmen sammeln.
- Kein Produkt als lieferbar bewerben, solange Inhalte nicht vorhanden sind.
- Produktionsfreigabe erst nach End-to-End-Tests.
