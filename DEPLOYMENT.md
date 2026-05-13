# Coolify Deployment Guide

This app runs as a standard **Next.js Node.js service** on Coolify with a **MongoDB resource** on the same server.

## 1. Prerequisites

- Coolify is installed on your server.
- This repository is pushed to GitHub, GitLab, or another git provider connected to Coolify.
- Your domain or subdomain is ready to point at Coolify.

## 2. Create the MongoDB resource

Create a MongoDB resource for this app:

- Resource name: `wad-dp-maker-db`
- Image: `mongo:7`
- Database: `default`

Use the **internal Mongo URL** from Coolify for `MONGODB_URI`.

Example format:

```txt
mongodb://USERNAME:PASSWORD@HOST:PORT/DATABASE?authSource=admin
```

If the URL path does not include a database name, that is fine because this app reads `MONGODB_DB_NAME` separately.

## 3. Create the application service

1. In Coolify, create a new **Application** from this repository.
2. Choose the branch you want to deploy.
3. Use the default Node.js/Nixpacks build.
4. Set:
   - **Application name:** `wad-dp-maker`
   - **Build Pack:** `Nixpacks`
   - **Base Directory:** `/`
   - **Port:** `3000`
   - **Is it a static site?:** `No`
5. In the Nixpacks advanced build section:
   - **Install Command:** leave empty
   - **Build Command:** leave empty
   - **Start Command:** `npm run start` or leave empty if auto-detected correctly
   - **Publish Directory:** leave empty

Important:

- Do **not** use `npm ci && npm run build` as a single custom build command.
- With Nixpacks, install and build happen in separate phases.

## 4. Configure environment variables

Add these in the Coolify app service:

```txt
MONGODB_URI=<paste-the-internal-mongo-url-from-wad-dp-maker-db>
MONGODB_DB_NAME=default
```

## 5. Attach the domain

1. Open the application in Coolify.
2. Add your full domain or subdomain.
3. Create or confirm the DNS A record that points the host to your Coolify server.
4. Wait for DNS to resolve.
5. Let Coolify issue SSL automatically.

After SSL is active, open the site over HTTPS.

## 6. First deployment

Deploy the application from Coolify once the env vars are set.

Expected result:

- build completes successfully
- app starts on port `3000`
- the public maker page at `/` loads
- the admin login page at `/admin/login` loads

## 7. Smoke-test checklist

Check these in production:

1. Open `/`.
2. Upload a photo.
3. Crop and zoom the photo.
4. Generate the JPG.
5. Download the JPG on desktop and mobile.
6. Open `/admin/login`.
7. Sign in with password `12345678`.
8. Confirm all-time count increased.
9. Confirm today count increased.
10. Confirm the latest event appears in the recent event log.

If MongoDB is unavailable, the JPG should still generate and download, but the UI will show a non-blocking count warning.

## 8. Backups and operations

Recommended minimum operations setup:

- Enable regular MongoDB backups or snapshots in your hosting stack.
- Review Coolify logs after deploys for startup or Mongo connection errors.
- Restart the app from Coolify after changing env vars.
- Monitor `/admin` after campaign launches to confirm event counts are moving.
- The admin stats password is hardcoded as `12345678`.

The MongoDB data is count-only:

- `wad_generation_events` stores frame ID and timestamp.
- `wad_generation_totals` stores the all-time aggregate total.
- Uploaded photos are not sent to the server.

## 9. Troubleshooting

### JPG generation works but count does not update

- Verify `MONGODB_URI` and `MONGODB_DB_NAME`.
- Confirm the MongoDB resource is running.
- Check Coolify logs for connection errors.
- Confirm the app was restarted after env var changes.

### `/admin` redirects to login

- Sign in at `/admin/login`.
- Use the hardcoded password `12345678`.
- If needed, log out and sign in again.

### `/admin` shows a Mongo error

- Confirm the app can reach the internal Mongo URL.
- Confirm the MongoDB credentials in `MONGODB_URI`.
- Check that `MONGODB_DB_NAME` is set to the intended database.

### App does not start after deploy

- Confirm Coolify is using Nixpacks.
- Leave custom install and build commands empty.
- Confirm the app service port is `3000`.
