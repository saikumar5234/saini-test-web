# Vercel Deployment Guide - Step by Step

This guide will help you deploy your Saini Dry Fruits web application to Vercel.

## Prerequisites

1. ✅ GitHub account (you already have: https://github.com/saikumar5234/saini-test-web)
2. ✅ Vercel account (create one at https://vercel.com if you don't have it)
3. ✅ Code pushed to GitHub (already done ✅)

---

## Step 1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended - easiest way)
4. Authorize Vercel to access your GitHub account

---

## Step 2: Import Your GitHub Repository

1. After logging in, you'll see the Vercel dashboard
2. Click **"Add New..."** button (top right)
3. Select **"Project"**
4. You'll see a list of your GitHub repositories
5. Find **"saini-test-web"** repository
6. Click **"Import"** next to it

---

## Step 3: Configure Project Settings

Vercel will auto-detect your project settings, but verify these:

### Framework Preset
- **Framework Preset**: `Vite` (should be auto-detected)
- If not detected, select **"Vite"** from the dropdown

### Build Settings
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### Environment Variables (if needed)
If your app uses environment variables:
1. Click **"Environment Variables"**
2. Add any variables you need (e.g., `VITE_BACKEND_URL`)
3. Click **"Add"** for each variable

---

## Step 4: Deploy

1. Review all settings
2. Click **"Deploy"** button
3. Wait for the build to complete (usually 1-3 minutes)
4. You'll see a success message with your deployment URL

---

## Step 5: Access Your Deployed App

After deployment:
- You'll get a URL like: `https://saini-test-web.vercel.app`
- This is your live application URL
- Share this URL with others to access your app

---

## Step 6: Custom Domain (Optional)

If you want a custom domain:

1. Go to your project dashboard on Vercel
2. Click **"Settings"** tab
3. Click **"Domains"** in the sidebar
4. Enter your domain name (e.g., `sainidryfruits.com`)
5. Follow the DNS configuration instructions
6. Vercel will automatically configure SSL/HTTPS

---

## Automatic Deployments

✅ **Automatic Deployments are enabled by default!**

- Every time you push to the `main` branch on GitHub, Vercel will automatically:
  - Build your app
  - Deploy the new version
  - Update your live site

You don't need to do anything manually after the initial setup!

---

## Troubleshooting

### Build Fails

1. Check the build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies → Check `package.json`
   - Build errors → Check console for errors
   - Environment variables missing → Add them in Vercel settings

### API Not Working

1. Check your `config.js` - make sure backend URL is correct
2. If using proxy in `vite.config.js`, note that Vercel uses different proxy configuration
3. You may need to add `vercel.json` for API rewrites (see below)

---

## Vercel Configuration File

I've created a `vercel.json` file for you with proper configuration. This handles:
- API proxy/rewrites
- SPA routing (React Router)
- Build optimizations

---

## Next Steps After Deployment

1. ✅ Test your deployed app
2. ✅ Check all features work correctly
3. ✅ Test API connections
4. ✅ Share the URL with your team

---

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

---

**That's it! Your app should now be live on Vercel! 🚀**


