# Railway Deployment Instructions for Virtual Assistant

**Execute these steps in order to deploy VonverIA Swim to Railway.**

---

## Prerequisites

- GitHub repository: https://github.com/VictorVonDoom1051/Vonveria-swim (must exist and have code pushed)
- Railway account at https://railway.app
- Railway CLI installed locally

---

## Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

---

## Step 2: Login to Railway

```bash
railway login
```

This opens browser for authentication. Complete the login.

---

## Step 3: Create Railway Project

```bash
# Navigate to project directory
cd C:\Users\siste\OneDrive\Desktop\VonverIA-Swim

# Initialize Railway project
railway init

# When prompted:
# - Select "Create a new project"
# - Name: "VonverIA Swim"
```

---

## Step 4: Link GitHub Repository

In Railway Dashboard (https://railway.app):

1. **Go to Project → Settings**
2. **Connect GitHub**
3. **Select repository:** VictorVonDoom1051/Vonveria-swim
4. **Enable auto-deploy on push** ✓

---

## Step 5: Add PostgreSQL Database

In Railway Dashboard:

1. **Click "New Service"**
2. **Select "Database"**
3. **PostgreSQL** 
4. Railway auto-provisions and sets `DATABASE_URL` environment variable

---

## Step 6: Configure Environment Variables

For **API service** (`@vonveria-swim/api`):

```
NODE_ENV=production
DATABASE_URL=<auto-set by Railway>
ADMIN_EMAIL=sistemas@vonveria.mx
ADMIN_PASSWORD=12345678acs
JWT_SECRET=<generate-random-string>
```

For **Web service** (`@vonveria-swim/web`):

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<api-service-url>.railway.app
```

---

## Step 7: Deploy

### Option A: Via GitHub (Recommended)

Just push to GitHub main branch:

```bash
git push origin main
```

Railway auto-detects and deploys.

### Option B: Via Railway CLI

```bash
railway up
```

---

## Step 8: Run Migrations

After deployment succeeds:

```bash
# Access Railway shell for API service
railway shell

# Inside Railway environment:
pnpm db:migrate
pnpm db:seed
```

Or use Railway Dashboard → API Service → "Shell" terminal.

---

## Step 9: Get Public URLs

Railway Dashboard → Project → Services:

- **Web URL:** `https://vonveria-swim-web-<random>.railway.app`
- **API URL:** `https://vonveria-swim-api-<random>.railway.app`

---

## Verify Deployment

```bash
# Check API health
curl https://vonveria-swim-api-<random>.railway.app/health

# Check Web
curl https://vonveria-swim-web-<random>.railway.app
```

---

## Mobile Testing

1. Open phone browser
2. Visit: `https://vonveria-swim-web-<random>.railway.app`
3. Login:
   - **Admin:** sistemas@vonveria.mx / 12345678acs
   - **Instructor:** instructor@vonveria.mx / instructor123

---

## Troubleshooting

### Build Failed
- Check Railway Dashboard → Service → "Logs"
- Verify `pnpm` version in package.json
- Ensure all dependencies are in pnpm-lock.yaml

### Database Connection Error
- Verify `DATABASE_URL` is set
- Check PostgreSQL service is running
- Ensure migrations ran successfully

### CORS Errors on Mobile
- Update `NEXT_PUBLIC_API_URL` in Web service env vars
- Must match exact API domain from Railway

### Container Port Issue
- Railway auto-detects ports from package.json scripts
- Ensure `start` script in root package.json points to web service

---

## Cost (First Month)

| Item | Cost |
|------|------|
| Compute (Web + API) | $0 (free tier) |
| PostgreSQL | $0 (free tier) |
| Storage | 5GB included |
| Total | **$0** |

*Free tier sufficient for internal beta testing*

---

## Next: Production Checklist

- [ ] All internal tests passed on staging
- [ ] Mobile responsive design verified
- [ ] Database backups tested
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

---

## Quick Command Reference

```bash
# Clone and setup
git clone https://github.com/VictorVonDoom1051/Vonveria-swim.git
cd Vonveria-swim
pnpm install

# Deploy
railway init
railway up

# Migrations
railway shell
pnpm db:migrate && pnpm db:seed

# Logs
railway logs

# Tear down (if needed)
railway delete
```

---

**Status:** Ready for automated deployment. Follow steps 1-8 for complete setup.
