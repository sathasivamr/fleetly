# Host Fleet UI on Firebase Hosting

This app is a static SPA (`npm run build` → `dist/`). Firebase Hosting serves `dist` and rewrites all routes to `index.html` for React Router.

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 2. Create a Firebase project

In [Firebase Console](https://console.firebase.google.com/), create a project, then enable **Hosting**.

## 3. Link this folder

From the `fleetly` directory:

```bash
firebase init hosting
```

Choose **Use an existing project**, select your project, set **public directory** to `dist`, configure as **single-page app** (yes to rewrite all URLs to index.html), and **do not** overwrite `firebase.json` if you already have the one from this repo.

Or edit [`.firebaserc`](.firebaserc) and replace `your-firebase-project-id` with your real project ID:

```json
{
  "projects": {
    "default": "your-real-project-id"
  }
}
```

## 4. Build with your Traccar URL

Production builds **do not** use the Vite dev proxy. Set `VITE_TRACCAR_URL` at **build time**:

```bash
VITE_TRACCAR_URL=https://demo.traccar.org npm run build
```

Traccar must allow **CORS** for your Firebase Hosting origin and **WebSocket** to `wss://…/api/socket`.

### Traccar server config (Firebase / any cross-origin UI)

The UI runs on **`https://<project-id>.web.app`** while Traccar is on another host (e.g. `https://traccar.example.com`). The browser only sends the session cookie on those API calls if CORS and cookie rules allow it. **Registration** can work without a session; **logged-in API calls** need a session cookie.

In Traccar’s config (`traccar.xml` / `default.xml`), add or merge:

```xml
<!-- Echo these exact Firebase URLs (comma-separated). Required for credentialed CORS. -->
<entry key='web.origin'>https://YOUR-PROJECT-ID.web.app,https://YOUR-PROJECT-ID.firebaseapp.com</entry>

<!-- Lets the JSESSIONID cookie be sent on cross-site XHR from Firebase (HTTPS only). -->
<entry key='web.sameSiteCookie'>None</entry>
```

Replace `YOUR-PROJECT-ID` with your Firebase project id (e.g. `traccar-tigerjump`). Traccar must be served over **HTTPS** when using `None` (cookie is forced `Secure`). Restart Traccar after editing.

If `web.origin` is set only to your Traccar site and **omits** the Firebase origins, the browser will not attach the session to API requests and you get **`SecurityRequestFilter` / HTTP 401** on protected routes after login.

## 5. Deploy

```bash
firebase deploy --only hosting
```

Your app will be at `https://<project-id>.web.app` and `https://<project-id>.firebaseapp.com`.

Use `npm run deploy:firebase` to build (with `VITE_TRACCAR_URL` set as needed) and deploy hosting.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| **401** from `SecurityRequestFilter` after login (registration OK) | Set Traccar **`web.origin`** to include both Firebase URLs (`*.web.app` and `*.firebaseapp.com`) and **`web.sameSiteCookie`** to **`None`** (see section above). Restart Traccar. |
| API 401 / CORS | `web.origin` must contain your exact SPA origin string(s). |
| `DELETE /api/session` returns **401** on logout | Common when the UI and Traccar are on different origins; the app treats logout 401 as clearing the client session. Same-origin hosting (your own reverse proxy) avoids this. |
| Live map / socket disconnects | Firewall, HTTPS, and `wss://` to the same host as `VITE_TRACCAR_URL`. |
| Wrong API after deploy | Rebuild with the correct `VITE_TRACCAR_URL`; env is baked in at build time. |
