Use this folder for the GitHub repo root for Cloudflare Pages.

Required repo structure:

- index.html
- app.js
- styles.css
- schema.sql
- functions/api/session.js
- functions/api/fuel.js
- functions/api/_lib/auth.js

Cloudflare Pages settings:

- Framework preset: None
- Build command: leave blank
- Build output directory: `.`

After Pages deploys, add:

- D1 binding `DB`
- environment variable `APP_PASSWORD`
- environment variable `AUTH_SECRET`
