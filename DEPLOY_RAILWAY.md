# 🚀 VonverIA Swim — Railway Deployment Guide

Deploy to Railway for cloud testing on mobile devices.

---

## Prerequisites

1. **Railway Account** — https://railway.app (free tier available)
2. **Git Repository** — Push your code to GitHub/GitLab
3. **GitHub Connection** — Connect your Railway account to GitHub

---

## Step 1: Push to GitHub

```bash
cd C:\Users\siste\OneDrive\Desktop\VonverIA-Swim

# Create a new GitHub repo (or use existing)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/vonveria-swim.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Railway Project

1. **Go to https://railway.app**
2. **Click "Create New Project"**
3. **Select "Deploy from GitHub"**
4. **Authorize & select your `vonveria-swim` repository**
5. **Railway auto-detects it's a monorepo with pnpm** ✅

---

## Step 3: Configure Services

Railway will auto-detect and create:
- **apps/web** (Next.js) — Frontend
- **apps/api** (NestJS) — Backend
- **PostgreSQL** — Database

### For Each Service:

#### Web (Next.js)
```
Service Name: vonveria-swim-web
Build: pnpm build
Start: pnpm start
Environment: NODE_ENV=production
Port: 3100
```

#### API (NestJS)
```
Service Name: vonveria-swim-api
Build: pnpm --filter @vonveria-swim/api build
Start: pnpm --filter @vonveria-swim/api start:prod
Environment: NODE_ENV=production
Port: 3001
```

#### Database (PostgreSQL)
```
Let Railway auto-provision PostgreSQL 15+
```

---

## Step 4: Configure Environment Variables

In Railway dashboard → Project Settings → Variables:

### Web Service (`vonveria-swim-web`)
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<api-domain>.railway.app
```

### API Service (`vonveria-swim-api`)
```
NODE_ENV=production
DATABASE_URL=$DATABASE_URL  # Auto-provided by PostgreSQL plugin
JWT_SECRET=<generate-random-secret>
ADMIN_EMAIL=sistemas@vonveria.mx
ADMIN_PASSWORD=12345678acs
```

### PostgreSQL Plugin
- **Auto-added by Railway** when you connect a database
- Provides `DATABASE_URL` environment variable
- **Initial password:** Auto-generated, save it

---

## Step 5: Run Migrations & Seed

After deployment, run migrations and seed:

### Option A: Railway Shell (Recommended)
1. In Railway dashboard → API service → "Shell"
2. Run:
```bash
pnpm db:migrate
pnpm db:seed
```

### Option B: Local Script
```bash
# After deployment, get DATABASE_URL from Railway
# Then locally:
DATABASE_URL=postgresql://user:pass@host/db pnpm db:migrate
DATABASE_URL=postgresql://user:pass@host/db pnpm db:seed
```

---

## Step 6: Get Public URLs

After successful deployment:

- **Web:** `https://vonveria-swim-web-<random>.railway.app`
- **API:** `https://vonveria-swim-api-<random>.railway.app`
- **Database:** Provided in Railway dashboard

---

## Step 7: Test on Mobile

### iPhone/Android
1. On your phone, open browser
2. Visit: `https://vonveria-swim-web-<random>.railway.app`
3. Login with:
   - **Admin:** `sistemas@vonveria.mx` / `12345678acs`
   - **Instructor:** `instructor@vonveria.mx` / `instructor123`

### Desktop (QA Testing)
- Visit same URL from laptop browser
- Test responsive design at different breakpoints
- F12 Developer Tools → Device toolbar

---

## Scaling (Beyond Free Tier)

| Tier | Price | Specs | Use Case |
|------|-------|-------|----------|
| **Free (Trial)** | $0 | 5GB RAM, 100GB storage | Development |
| **Pay as you go** | ~$0.000231/hour | Per 1 CPU/1GB RAM | Small pilot |
| **Starter Plan** | $5-15/month | 2 CPU, 4GB RAM, dedicated DB | Production pilot |

---

## Monitoring & Logs

### View Logs
```
Railway Dashboard → Service → Logs
```

### Check Health
```bash
# API health check
curl https://<api-domain>.railway.app/health

# Web health check  
curl https://<web-domain>.railway.app
```

### Common Issues

**502 Bad Gateway**
- Check API service logs
- Verify DATABASE_URL is correct
- Ensure migrations ran

**Database connection refused**
- Verify PostgreSQL service is running
- Check DATABASE_URL in environment
- Ensure firewall allows connections

**CORS errors on mobile**
- Verify NEXT_PUBLIC_API_URL matches actual API domain
- Check API CORS configuration

---

## Backup & Data

### Export Database (Before Deleting Project)
```bash
# From Railway shell or local
pg_dump $DATABASE_URL > backup.sql
```

### Restore Database
```bash
psql $DATABASE_URL < backup.sql
```

---

## Cost Estimate (First Month)

| Service | Hours | Cost/Hour | Total |
|---------|-------|-----------|-------|
| Web (Next.js) | 730 | $0.00 | $0 (free tier) |
| API (NestJS) | 730 | $0.00 | $0 (free tier) |
| PostgreSQL | 730 | $0.00 | $0 (free tier) |
| **Total** | — | — | **$0 (free tier)** |

*Free tier limits: 5GB storage, 100GB/month egress. Sufficient for pilot testing.*

---

## Next: Mobile-Specific Testing

After deployment, test these flows on mobile:

- [ ] Login works on mobile keyboard
- [ ] Navigation hamburger menu works
- [ ] Tables scroll horizontally on small screens
- [ ] Forms are touch-friendly (tap targets 44x44px+)
- [ ] Modals render properly on small viewports
- [ ] Images scale correctly
- [ ] No layout shifts (cumulative layout shift < 0.1)
- [ ] Touch interactions (click/tap) work without hover issues

---

## Quick Deployment Summary

```bash
# 1. Push to GitHub
git push origin main

# 2. Create Railway project from GitHub
# (via https://railway.app)

# 3. Configure environment variables in Railway dashboard

# 4. Deploy (auto on git push after connected)

# 5. Run migrations via Railway shell
pnpm db:migrate && pnpm db:seed

# 6. Visit: https://vonveria-swim-web-<id>.railway.app
```

**Estimated time:** 5-10 minutes from GitHub push to live app.

---

## Support

**Railway Docs:** https://docs.railway.app  
**Railway Status:** https://status.railway.app  
**GitHub Issues:** Create issue in your repo if deployment fails

---

**Status:** ✅ Ready to deploy. Follow steps 1-7 and you'll have a live, mobile-testable staging environment.
