# SardIO landing page

Static one-page website for [sardio.dev](https://sardio.dev), deployed through GitHub Pages.

## Project structure

```text
src/
  index.html       Page content and sections
  styles.css       Layout, themes, lighting, and responsive styles
  main.js          Theme, lamp, navigation, and relief interactions
public/
  assets/          Images served without processing
  CNAME            GitHub Pages custom domain
  robots.txt       Search crawler rules
  sitemap.xml      Search index entry
scripts/
  build.mjs        Production build and validation
dist/              Generated deployment output (not committed)
```

## Update the site

- Edit copy or section structure in `src/index.html`.
- Edit visual styling in `src/styles.css`.
- Edit interactions in `src/main.js`.
- Add static images to `public/assets/` and reference them as `assets/filename.ext`.

## Build

```bash
pnpm run build
```

## Google Search Console verification

This site is static, so the easiest verification methods are:

- **Meta tag** (recommended): set `GOOGLE_SITE_VERIFICATION` when building.
- **HTML file**: set `GOOGLE_HTML_VERIFICATION_FILE` and `GOOGLE_HTML_VERIFICATION_CONTENT` when building.

Example (PowerShell):

```powershell
$env:GOOGLE_SITE_VERIFICATION="YOUR_TOKEN_HERE"
pnpm run build

# OR (HTML file method)
$env:GOOGLE_HTML_VERIFICATION_FILE="google1234567890abcdef.html"
$env:GOOGLE_HTML_VERIFICATION_CONTENT="google-site-verification: google1234567890abcdef.html"
pnpm run build
```

The generated GitHub Pages artifact is written to `dist/`. Pushes to `main` run the deployment workflow in `.github/workflows/deploy-pages.yml`.

## Google Analytics

This site can optionally inject the GA4 tag at build time via `GA_MEASUREMENT_ID`.

Example (PowerShell):

```powershell
$env:GA_MEASUREMENT_ID="G-XXXXXXXXXX"
pnpm run build
```
