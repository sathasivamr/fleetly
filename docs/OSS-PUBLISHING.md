# Publishing Fleetly (`fleetly`) as open source

Use this as a checklist when splitting a **public** tree from a private monorepo.

## Repository boundary

**Recommended:** a **public** GitHub repository containing only the `fleetly/` app (or a scrubbed copy), with **private** repos or packages for:

- Enterprise branding, billing, and customer-specific integrations.
- Proprietary REST APIs for logistics orders (optional: the app supports `VITE_LOGISTICS_API_URL` for JSON REST—see `.env.example`).

**Alternative:** monorepo with `packages/fleetly-oss` (MIT) and private packages that are never pushed to the public remote. Requires strict CI and remote discipline to avoid leaks.

## Inventory (example)

| Ship in public OSS | Keep private |
|--------------------|--------------|
| `fleetly/src/**`, `package.json`, Vite config | Real `.env`, API keys, Firebase project IDs used in production |
| `LICENSE`, `NOTICE`, `CONTRIBUTING.md`, `docs/**` | Customer domains in nginx/deploy snippets |
| `.env.example` (placeholders only) | `traccar/` web UI until AGPL strategy is clear |

## Scrub before first push

1. Copy `fleetly/` to a clean directory or use `git filter-repo` to remove history containing secrets.
2. Ensure `.gitignore` includes `.env` (see `fleetly/.gitignore`).
3. Replace any hardcoded domains with `example.com` or placeholders in samples.
4. Run `npm run lint` and `npm run build`.

## Logistics commercial seam

- **OSS-friendly default:** no Firebase and no `VITE_LOGISTICS_API_URL` → orders use **browser localStorage** (labeled “Demo data” in the UI).
- **Optional Firebase:** set `VITE_FIREBASE_*` for Firestore-backed orders and route plans.
- **Optional private/commercial API:** set `VITE_LOGISTICS_API_URL` to a base URL; the client calls `GET/POST /orders`, `PUT/DELETE /orders/:id` with `credentials: 'include'` (adjust CORS/session on your server).

A future **private npm package** can wrap proprietary fetch/auth and be imported only in a non-public build; the OSS tree stays free of that code.

## npm package boundary (optional)

You may publish a small **MIT** package (e.g. Traccar API helpers) from `src/lib/api.js` patterns later. That is independent of this publishing guide.
