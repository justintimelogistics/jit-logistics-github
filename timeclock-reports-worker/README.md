# Time Clock Report Worker

This Cloudflare Worker sends:

- a 7-day detailed time clock email every Monday
- a monthly summary email on the first day of each month

It uses:

- the same `jit-logistics-db` D1 database as the Pages app
- Zoho Mail API environment variables

## Cloudflare setup

1. Create a new Worker from this folder.
2. In `wrangler.toml`, replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with your real D1 database id.
3. Add these Worker environment variables:
   - `ZOHO_MAIL_ACCOUNT_ID`
   - `ZOHO_MAIL_FROM_ADDRESS`
   - `ZOHO_CLIENT_ID`
   - `ZOHO_CLIENT_SECRET`
   - `ZOHO_REFRESH_TOKEN`
   - `REPORT_EMAIL_TO`
4. Bind D1 as `DB`.
5. Deploy the Worker.

## Cron behavior

- The Worker runs once daily at `11:00 UTC`.
- On Mondays, it emails the previous 7 full days.
- On the first day of the month, it emails the previous closed month.

## Manual test

After deploy, you can `POST` to:

- `/run-now?kind=weekly`
- `/run-now?kind=monthly`
- `/run-now?kind=all`

to test immediately.
