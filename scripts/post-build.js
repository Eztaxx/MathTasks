// scripts/post-build.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '200.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✅ scripts/post-build.js: dist/200.html created for Cloudflare Pages SPA.');
}

const redirectsPath = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  fs.unlinkSync(redirectsPath);
  console.log('⛕ scripts/post-build.js: dist/_redirects removed.');
}
