# Contributing to Fleetly

Thank you for helping improve this project.

## Development

- Node.js LTS recommended.
- From the `fleetly/` project root: `npm install`, then `npm run dev` for local development.
- Copy `.env.example` to `.env` and point `VITE_TRACCAR_URL` at your Traccar instance (or the public demo server for experiments).

## Checks before you submit a change

- `npm run lint`
- `npm run build`

## Pull requests

- Keep changes focused and describe what you changed and why.
- Do not commit real secrets, production domains, or `.env` files with credentials. Use `.env.example` for documented placeholders only.

## Licensing

By contributing, you agree your contributions are licensed under the same terms as this project (MIT). If you are unsure about licensing implications for a large change, ask the maintainers.
