# ASCII Blobs Demo

This interactive demo showcases all the customization options available in the `ascii-blobs` library.

## Local Development

To run this demo locally:

```bash
# Build the library first
npm run build

# Then serve the demo folder
npm run demo

# Or use Python's built-in server
cd demo && python3 -m http.server 3000
```

## GitHub Pages Setup

This demo is configured to auto-deploy to GitHub Pages. To enable it:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add interactive demo"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy on every push to `main`

3. **Access your demo**:
   - Your demo will be available at: `https://[username].github.io/[repo-name]/`
   - Example: `https://daanh.github.io/ascii-blobs-library/`

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles building the library and deploying the demo folder automatically.

