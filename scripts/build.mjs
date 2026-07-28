import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src/index.html');
const outputDir = resolve('dist');
let html = await readFile(source, 'utf8');

const buildId = (process.env.ASSET_VERSION || '').trim() || `${Date.now()}`;
html = html
  .replaceAll('assets/styles.css', `assets/styles.css?v=${buildId}`)
  .replaceAll('assets/main.js', `assets/main.js?v=${buildId}`);

const gaMeasurementId = process.env.GA_MEASUREMENT_ID?.trim();
if (gaMeasurementId) {
  if (!/^G-[A-Z0-9]+$/i.test(gaMeasurementId)) {
    throw new Error('GA_MEASUREMENT_ID must look like G-XXXXXXXX');
  }

  const gaSnippet = [
    '  <!-- Google tag (gtag.js) -->',
    `  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>`,
    '  <script>',
    '    window.dataLayer = window.dataLayer || [];',
    '    function gtag(){dataLayer.push(arguments);}',
    '    gtag(\'js\', new Date());',
    `    gtag('config', '${gaMeasurementId}');`,
    '  </script>'
  ].join('\n');

  if (!html.includes('googletagmanager.com/gtag/js') && !html.includes('gtag(')) {
    html = html.replace('</head>', `${gaSnippet}\n</head>`);
  }
}

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
if (googleSiteVerification) {
  const metaTag = `<meta name="google-site-verification" content="${googleSiteVerification}">`;
  if (!html.includes('name="google-site-verification"')) {
    html = html.replace('</head>', `  ${metaTag}\n</head>`);
  }
}

const required = [
  '<!doctype html>',
  'id="hero"',
  'id="about"',
  'id="contact"',
  'Ahmed Sayed',
  'assets/founder-ahmed-dark.png',
  'assets/styles.css',
  'assets/main.js'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Build validation failed: missing ${marker}`);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(resolve('public'), outputDir, { recursive: true });

const googleHtmlVerificationFile = process.env.GOOGLE_HTML_VERIFICATION_FILE?.trim();
const googleHtmlVerificationContent = process.env.GOOGLE_HTML_VERIFICATION_CONTENT ?? '';
if (googleHtmlVerificationFile) {
  if (!/^[a-zA-Z0-9._-]+\.html$/.test(googleHtmlVerificationFile)) {
    throw new Error('GOOGLE_HTML_VERIFICATION_FILE must be a simple *.html filename');
  }
  await writeFile(
    resolve(outputDir, googleHtmlVerificationFile),
    googleHtmlVerificationContent,
    'utf8'
  );
}

await writeFile(resolve(outputDir, 'index.html'), html, 'utf8');
await cp(resolve('src/styles.css'), resolve(outputDir, 'assets/styles.css'));
await cp(resolve('src/main.js'), resolve(outputDir, 'assets/main.js'));

console.log(`Built SardIO landing page → ${outputDir}`);
