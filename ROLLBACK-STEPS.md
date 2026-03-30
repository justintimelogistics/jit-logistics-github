Replace the GitHub repo contents with the files in this folder to return to the stable fuel-only app.

Expected repo root:

- index.html
- app.js
- styles.css
- schema.sql
- README.md
- functions/

Expected API files:

- functions/api/fuel.js
- functions/api/session.js
- functions/api/lib/auth.js

After upload:

1. Let Cloudflare redeploy.
2. Confirm the build log says `Found Functions directory at /functions. Uploading.`
3. Confirm there are no import errors.
