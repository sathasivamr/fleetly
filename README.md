# Fleetly

React + Vite SPA for Traccar fleet management: live tracking, reports, logistics (with optional demo data or your own API), and more.

## Quick start

```bash
cp .env.example .env
# Set VITE_TRACCAR_URL to your Traccar server (see .env.example)
npm install
npm run dev
```

Dev server defaults to port **3001** and proxies `/api` to your Traccar URL.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | ESLint |

## Docs

- [Contributing](CONTRIBUTING.md)
- [Publish to GitHub](docs/GITHUB.md)
- [OSS / legal notes](OSS.md) · [Legal checklist](docs/LEGAL.md)

## License

MIT — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
