# JIT Logistics App

Cloudflare Pages app for the JIT Logistics internal dashboard.

## Current scope

- dashboard UI for fuel tracking
- add-fuel modal for current mile, gallons, and price
- Cloudflare Worker-style backend for Pages
- Cloudflare D1 database for shared fuel entries
- password-protected session flow for the live app
- local fallback mode when opened directly from `index.html`

## Files that matter

- `index.html` - dashboard UI
- `styles.css` - app styling
- `app.js` - frontend logic and API calls
- `_worker.js` - API routes, session cookies, and D1 access
- `schema.sql` - D1 table setup
- `wrangler.toml` - Cloudflare config template

## Cloudflare setup

### 1. Create the D1 database

Create a D1 database in Cloudflare named `jit-logistics-db`.

### 2. Run the schema

In the D1 SQL console, run the contents of `schema.sql`.

### 3. Connect the Pages project to D1

In the Pages project:

- go to `Settings`
- open `Functions`
- open `D1 bindings`
- add a binding named `DB`
- connect it to your `jit-logistics-db` database

### 4. Add environment variables

In the Pages project environment variables, add:

- `APP_PASSWORD` - the password you will use to access the app
- `AUTH_SECRET` - a long random secret string used to sign login sessions

### 5. Deploy these files

If your current Pages site was uploaded through the Cloudflare dashboard, redeploy this whole folder with `_worker.js` included at the root.

Cloudflare’s official docs note that advanced mode uses a root `_worker.js` file in the Pages output directory:
[Cloudflare Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)

## What happens after setup

- opening `app.jitlogisticsllc.com` shows a password screen
- after sign-in, all devices load the same fuel entries from D1
- new fuel entries are stored in Cloudflare instead of browser-only storage

## Next modules

- truck and trailer profiles
- trip tracking
- CT mileage
- tolls
- repairs
- reports
