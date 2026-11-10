# Stripe Checkout + Supabase setup (NOT DEPLOYED)

The backend source files are prepared for a secure payment integration. They are **not deployed**, and the current GitHub Pages demo **does not call them**.

## Requirements
- Supabase project and database migration `20261110_initial.sql` followed by `20261111_payment_provisioning.sql`
- Stripe merchant account, verification and access to intended payment methods
- Private environment secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_SITE_URL`
- Configure Stripe webhook endpoint `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`
- Deploy `create-checkout` with JWT validation, `stripe-webhook` with JWT validation disabled but strict Stripe signature verification
- Ensure site URL is exact allowed origin, e.g. `https://grizzlys-club.github.io/-` (without trailing slash, update if using a domain)

## Supported methods
Hosted Stripe Checkout may show Apple Pay, Google Pay, cards and TWINT depending on merchant eligibility, country, customer device and dashboard settings. Availability must be verified in a real Stripe test account; no payment method is guaranteed here.

## Critical remaining work
- Connect frontend to Supabase Auth and this checkout endpoint (currently still demo-only)
- Implement fulfilment email, invitation link and QR code
- Implement personal world setup, safe child data handling, server-side entitlement checks and Advent date locks
- Produce all 24 videos and host them privately
- Add refund handling and automated end-to-end tests
- Test the webhook transaction and Stripe API version against installed SDK before production
- Confirm legal policies and business identity
- **Never use real charges before final approval and complete test coverage.**

## Security notes
The RPC checks session ID, currency and amount and is restricted to service_role. The checkout endpoint gets authenticated user ID from Supabase, prices from DB and uses hosted Stripe Checkout. Secrets must remain server-side. This code is a starting implementation, not an audited production release.
