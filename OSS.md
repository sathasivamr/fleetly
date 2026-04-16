# Open source scope (project decision)

**Chosen scope for public open source:** **`fleetly/` as a self-contained MIT-licensed React app** (Vite + Traccar REST/WebSocket client patterns).

What this **includes**:

- The Fleetly SPA, shared UI components, and documentation shipped under `fleetly/` (license, notices, env examples).

What this **does not include** by default:

- The **`traccar/`** classic web UI tree in the parent workspace (separate upstream license, often AGPL—see `docs/LEGAL.md`).
- **Commercial-only** backends (your private orders API, billing, SSO) and **deployment secrets**.

**Alternatives** considered but not selected as the primary OSS artifact: API-client-only package, or docs/examples-only repo. Those can be added later as separate packages if needed.
