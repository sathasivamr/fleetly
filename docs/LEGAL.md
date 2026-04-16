# Legal checklist (before any public release)

This document is **not legal advice**. It records decisions and reminders for maintainers.

## Counsel review (required)

- **Engage qualified counsel** before publishing this codebase or distributing binaries that include uncertain components.
- Ask specifically about:
  - **AGPL-3.0** and the `traccar/` tree (if it derives from Traccar’s web UI and you **distribute** it).
  - **MIT** (or Apache-2.0) for `fleetly/` if it was authored without copying AGPL-covered UI code—**confirm with counsel and history review**.

## Typical split in this workspace

| Area | Notes |
|------|--------|
| `fleetly/` | Intended OSS **candidate** under MIT (see `LICENSE`). Still confirm provenance and dependencies. |
| `traccar/` (if present) | Often aligned with upstream Traccar licensing (**AGPL-3.0** for the classic web app). **Do not** assume you can relicense without analysis. |
| Commercial add-ons | Proprietary APIs, billing, customer config, and deployment secrets stay **private**. |

## Pre-publish scrub

- No committed `.env` with real keys; use `.env.example` only in public trees.
- No customer-specific domains or SSL material in public examples (use placeholders).

When in doubt, delay publication until counsel signs off.
