import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src/index.html');
const outputDir = resolve('dist');
const html = await readFile(source, 'utf8');

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
await cp(source, resolve(outputDir, 'index.html'));
await cp(resolve('src/styles.css'), resolve(outputDir, 'assets/styles.css'));
await cp(resolve('src/main.js'), resolve(outputDir, 'assets/main.js'));

console.log(`Built SardIO landing page → ${outputDir}`);
