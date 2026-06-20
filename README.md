# Tropical Gardens Hotel Kyenjojo

Official website for Tropical Gardens Hotel, a premium garden hotel in Kyenjojo, Uganda.

(Updated security & deployment notes)

## Quick security & admin checklist (added)

1. Protect the admin dashboard
   - Remove or unlink `admin.html` from public navigation. Consider serving admin from a protected subdomain or behind authentication.
   - Add `meta name="robots" content="noindex,nofollow"` to any admin HTML to request search engines not to index it.
   - For production, enable authentication on admin routes and don't host admin pages on the same public domain without auth.

2. Configure your API base URL
   - Set `window.TGH_API_BASE` to your deployed backend before loading the frontend. The repository `app-config.js` now defaults to:
     `https://tropical-gardens-hotel-api.onrender.com`
   - To override at deploy time, inject a small script or replace `app-config.js` during your build/deploy step.

3. Pesapal & payment keys
   - Keep Pesapal keys and any payment secrets in backend environment variables (Render/Heroku/Render/Netlify env) and never commit them.
   - Configure `PESAPAL_*` variables securely where the backend will read them.

4. Supabase keys
   - The frontend uses an anon Supabase key (publishable). This is acceptable for client reads/writes controlled by RLS.
   - Never commit service-role keys. If you find any, rotate immediately.

5. Scan for secrets
   - Use tools like `git-secrets`, `truffleHog`, or the provided `scripts/scan-secrets.sh` to find accidental commits of secrets.

---

See `DEPLOYMENT.md` and `backend/README.md` for backend deployment and Pesapal instructions.
