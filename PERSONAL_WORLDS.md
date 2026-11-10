# One personal WichtelZauber world per customer purchase

## Core model
Each verified paid order has its own `worlds.id` UUID, tied to a family and order. Multiple orders by one customer can have separate worlds. All per-world data is scoped to that world ID.

## Customer experience
1. Family configures an elf and package.
2. The authenticated customer completes a verified payment.
3. Trusted backend creates a new family/world with a unique world ID.
4. The customer receives an email with a secure invitation.
5. The customer signs in and opens `/w/<world-id>` (route still to be implemented); access checks enforce ownership, not merely knowledge of the URL.
6. The app loads this world's package entitlement, elf, appearance, children, progress, letters, stories and games.
7. Each family has independent progress and settings.

## Package entitlement
- Basic: elf, house, 24 stories.
- Magic: Basic + interactive house, letters, minigames.
- Ultimate: Magic + village, forest, activities and up to 4 children.

## Status
The schema and per-owner read function are added in source. They are **not deployed or connected to the demo frontend**. A production implementation still requires secure authenticated routes, backend-side package enforcement, actual content/assets, transactional order fulfilment and invite redemption.

## Privacy
Never use family surnames as public world IDs or as a security mechanism. Do not expose child names in public URLs or emails. Prefer minimal child data (nickname only), access controlled by parents.
