# Deploying ResumeOS

Two pieces, deployed separately: the **API** (Railway, from `server/Dockerfile`) and the **frontend** (Vercel, a static site). All of it works on free tiers.

Deploy in this order, because each side needs the other's URL.

## 1. Database — MongoDB Atlas

1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with a password (read and write to any database).
3. **Network Access** → add `0.0.0.0/0`. Railway's outbound IPs aren't fixed, so a narrower rule would break.
4. **Connect → Drivers** → copy the connection string and put your password in it. This is `MONGODB_URI`.

## 2. API — Railway

1. [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo** → pick `resumeos`.
2. Open the service → **Settings** → set **Root Directory** to `server`. Railway then builds `server/Dockerfile`.
3. **Variables**:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | the Atlas string from step 1 |
   | `CLIENT_URL` | your frontend URL from step 3 (you can set a placeholder now and fix it after) |

   Railway sets `PORT` itself, and the Dockerfile sets `NODE_ENV=production`.
4. **Settings → Networking → Generate Domain**. Open it: `https://<name>.up.railway.app/` should answer `{"status":"ok","service":"resumeos-api"}`.

## 3. Frontend — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import `resumeos`.
2. Set **Root Directory** to `frontend`. Vercel detects Vite on its own. `frontend/vercel.json` makes deep links such as `/resumes/abc` work on refresh.
3. **Environment Variables**: `VITE_API_URL` = the Railway URL from step 2, with no trailing slash. This is baked in at build time, so changing it later needs a redeploy.
4. Deploy.

## 4. Connect them

Go back to Railway and set `CLIENT_URL` to the exact Vercel URL (for example `https://resumeos.vercel.app`, no trailing slash). CORS only allows that one origin, so a mismatch shows up as failed requests in the browser console. Redeploy the API after changing it.

## 5. Check it works

1. Open the Vercel URL → **Create my resume**.
2. Type a name, wait for "All changes saved", and refresh. It should still be there.
3. Click **Download PDF**. If saving works but the PDF fails, Chromium isn't launching: check the Railway logs.

## Notes

- Free-tier Railway services can sleep or run out of monthly credit. If the API is down, the app loads but can't save.
- Anyone can create resumes, so watch your Atlas storage. The API caps each guest at 25 resumes, and the PDF route is rate-limited.
- The Dockerfile has not been verified end to end yet. If the first Railway build fails, the build log will say why.
