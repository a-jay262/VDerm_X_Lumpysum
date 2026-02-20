# VDerm-X Backend Deployment Guide (Railway)

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)
- Backend code pushed to GitHub

## Step 1: Push Your Code to GitHub

If you haven't already, create a GitHub repository and push your code:

```bash
# Initialize git (if not already done)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/VDerm-X.git

# Push code
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/Log in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Connect your GitHub account and select your `VDerm-X` repository
6. Railway will auto-detect the NestJS backend
7. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`

## Step 3: Add Environment Variables

In Railway dashboard:
1. Go to your project → Variables
2. Add any environment variables your backend needs (MongoDB URI, etc.)

## Step 4: Get Your Public URL

Once deployed:
1. Go to your Railway project deployment
2. Find the **"Public URL"** (looks like `https://vderm-x-production.up.railway.app`)
3. This is your public backend URL

## Step 5: Update Frontend Configuration

Update `VDerm-X/src/config.ts`:

```typescript
export const BASE_URL = 'https://YOUR_RAILWAY_URL';
```

## Step 6: Rebuild and Test

```bash
cd VDerm-X
npm run build
```

## Troubleshooting

- **Build failures**: Check Railway logs in the dashboard
- **CORS issues**: Your backend already has `app.enableCors()` enabled ✓
- **Database connection**: Ensure MongoDB URI is set in environment variables

## Free Tier Limits

- 5GB storage
- 500 monthly hours (free tier)
- Enough for small projects

---

**Need help?** Check Railway docs: https://docs.railway.app
