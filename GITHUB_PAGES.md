# GitHub Pages Deployment Guide

This repository is configured to automatically deploy the demo to GitHub Pages.

## Quick Setup

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add demo and GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages in your repository**:
   - Navigate to your repository on GitHub
   - Click **Settings** → **Pages** (in the sidebar)
   - Under **Source**, select **"GitHub Actions"**
   - Save

3. **Wait for deployment**:
   - Go to the **Actions** tab in your repository
   - You should see a "Deploy Demo to GitHub Pages" workflow running
   - Once it completes (green checkmark), your demo is live!

4. **Access your demo**:
   - The URL will be: `https://[your-username].github.io/[repo-name]/`
   - For example: `https://daanh.github.io/ascii-blobs-library/`

## How It Works

The workflow in `.github/workflows/deploy.yml`:
1. Triggers on every push to `main` branch
2. Installs dependencies (`npm ci`)
3. Builds the library (`npm run build`)
4. Deploys the `demo/` folder to GitHub Pages

## Customizing the Demo

Edit `demo/index.html` to customize:
- Styles
- Default configuration values
- UI layout
- Additional features

After making changes, just commit and push - the demo will automatically redeploy!

## Troubleshooting

**Workflow not running?**
- Make sure GitHub Actions are enabled in your repo settings
- Check that the workflow file is in `.github/workflows/deploy.yml`

**404 error when accessing the page?**
- Ensure GitHub Pages is set to "GitHub Actions" (not "Deploy from a branch")
- Wait a few minutes after the first deployment
- Check the Actions tab for any deployment errors

**Demo not updating?**
- Clear your browser cache
- Check that the workflow ran successfully in the Actions tab
- Verify your changes were pushed to the `main` branch
