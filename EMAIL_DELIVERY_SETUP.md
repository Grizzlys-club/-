# WichtelZauber personal world email – implementation status

## Built in source code
- `send-world-email` Supabase Edge Function prepares a personalized HTML welcome email with a private invitation URL.
- It checks paid order status, finds the matching world and customer's authenticated email, and uses Resend for delivery.
- Package-specific copy for Basic, Magic and Ultimate.
- `world_invitations` stores only a SHA-256 token hash; `email_deliveries` stores sending status.

## Not finished / not yet working in production
- **The payment webhook does not yet invoke this email function.** Must integrate a reliable queue/outbox, with retry and concurrency protection.
- **The personal invite URL is not yet handled by the frontend** and needs a server-side redemption function. Never treat a token in the URL as authentication without verifying it against the stored hash and enforcing access permissions.
- Current frontend does not yet render all package-specific features.
- Resend account, verified sending domain, `MAIL_FROM`, `RESEND_API_KEY`, `INTERNAL_DELIVERY_SECRET`, `PUBLIC_SITE_URL` are needed as private environment secrets.
- Deploy database migration and function, then test real deliverability, spam placement, expiration/rotation of tokens, rate limits, retries and duplicate delivery.
- The email sender currently rotates the token on retry. A production queue must coordinate retries and link validity so that only successfully delivered links remain active.
- Do not claim automatic delivery works until webhook integration, token redemption, deployment and end-to-end tests are complete.

## Security
Keep secret keys server-side; never store child details in email; do not expose family data through public invitation URLs without authorization.
