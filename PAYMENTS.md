# WichtelZauber – Zahlungsarten

Gewünscht: TWINT, Apple Pay, Google Pay, Visa, Mastercard und weitere passende Methoden.

## Architektur
- Gehosteter Checkout bei einem Schweizer-kompatiblen Zahlungsanbieter, z. B. Stripe Checkout, sofern die Methode für das Händlerkonto verfügbar ist.
- **Preise nur serverseitig** aus der Produktdatenbank: Basic CHF 14.90, Magic CHF 29.90, Ultimate CHF 49.90.
- Apple Pay / Google Pay erscheinen nur auf unterstützten Geräten und Browsern und nach erfolgreicher Einrichtung.
- TWINT hängt von Land, Anbieter, Aktivierung und Händlerkonto ab. Verfügbarkeit vor Live-Schaltung verifizieren.
- Checkout erzeugt zunächst eine pending-Bestellung.
- Signierter Webhook prüft Anbieter-Event, Bestellung, Währung CHF und Betrag; nur dann Status paid und persönliche Wichtelwelt erzeugen.
- Doppelte Webhook-Events müssen idempotent verarbeitet werden.
- Rückerstattungen und Stornierungen berücksichtigen.
- Secrets gehören ausschliesslich in Server-Umgebungsvariablen, niemals ins Frontend oder öffentliche GitHub-Repository.

## Status
**Konzept und Anforderungen dokumentiert; keine Zahlungsanbindung aktiv.** Der bisherige Demo-Checkout bleibt ohne echte Abbuchung. Für Live-Zahlungen braucht es ein verifiziertes Händlerkonto, eine sichere Serverumgebung und erfolgreiche Testzahlungen.
