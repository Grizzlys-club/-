# WichtelZauber: Produktions-E-Mail-Versand

Der GitHub-Pages-Demolink verschickt keine E-Mails. Diese Checkliste beschreibt die einmalige Inbetriebnahme. Zahlungsannahme bis zum erfolgreichen End-to-End-Test deaktiviert lassen.

## 1. Supabase-Projekt
- Projekt auf https://supabase.com/dashboard anlegen.
- SQL-Migrationen in zeitlicher Reihenfolge ausführen: 20261110_initial.sql, 20261111_payment_provisioning.sql, 20261112_world_delivery.sql, 20261113_personal_worlds.sql, 20261114_world_progress.sql.
- Auth > URL Configuration: Site URL auf die endgültige Shop-Domain setzen; Redirect URLs für die Welt-Domain mit gültigem Pfad konfigurieren.
- Auth > Providers > Email aktivieren. Für zuverlässige Anmeldelinks unter Project Settings > Authentication > SMTP einen verifizierten SMTP-Anbieter einrichten und testen.
- In /welt/world-config.json ausschliesslich die öffentliche Projekt-URL und den **publishable/anon key** eintragen. Niemals service_role oder andere Secrets dort veröffentlichen.

Beispiel:
```json
{"supabaseUrl":"https://DEIN-PROJEKT.supabase.co","supabaseAnonKey":"DEIN_PUBLIC_KEY"}
```

## 2. Resend und E-Mail-Domain
- https://resend.com/domains : eigene Versanddomain hinzufügen und die angegebenen DNS-Einträge verifizieren.
- Supabase Edge Function Secrets (nur serverseitig): RESEND_API_KEY, MAIL_FROM (verifizierter Absender), INTERNAL_DELIVERY_SECRET (langer zufälliger Wert), PUBLIC_SITE_URL (tatsächlich erreichbare Shop-Basis-URL), STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
- Edge Functions `send-world-email`, `stripe-webhook`, `create-checkout` deployen. `send-world-email` und `stripe-webhook` erhalten JWT-Prüfung **aus**, verwenden aber ihre eigenen Geheimnis-/Signaturprüfungen.
- Stripe Webhook auf `https://DEIN-PROJEKT.supabase.co/functions/v1/stripe-webhook` für `checkout.session.completed` und `checkout.session.async_payment_succeeded` registrieren.

## 3. Wichtiger Hinweis zur Shop-Integration
Der vorhandene statische Shop ist eine Demo. Ein echter Checkout muss erst Auth/JWT an `create-checkout` übergeben. Vorher keine Kunden bezahlen lassen. Ein erfolgreiches Stripe-Testereignis muss eine bezahlte Bestellung, eine neue Welt und genau eine Zustell-E-Mail erzeugen. Bei Wiederholung des Events darf keine zweite Welt entstehen.

## 4. Abnahmetests
- Neue Testadresse registrieren; Anmeldelink erhalten und einloggen.
- Stripe-Testzahlung für jedes Paket auslösen.
- Prüfen, dass nur die richtige Familie auf die URL ihrer Welt zugreifen kann.
- E-Mail im Posteingang und Spam testen; Resend-Zustellprotokolle prüfen.
- 24 Tage, Briefe, Missionen, Berechtigungen und 3D-Welt auf iPhone, Android, Safari und Chrome testen.
- Vor echten Verkäufen Datenschutz, Impressum, Widerruf/AGB, kindgerechte Datenminimierung und Backups prüfen.

Keine Geheimnisse in GitHub-Dateien oder Chatnachrichten posten.
