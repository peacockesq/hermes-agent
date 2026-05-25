import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const targets = [
  ['staging', 'http://37.27.49.209:5174/'],
  ['live', 'http://37.27.49.209:5175/'],
];

const outDir = path.resolve('proof', 'screenshots-seven-ui');
await fs.mkdir(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, url] of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const healthUrl = url.replace(/\/$/, '/api/health');
  const health = await page.request.get(healthUrl);
  const healthJson = await health.json().catch(() => null);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(outDir, `${stamp}-${name}-desktop.png`), fullPage: true });
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  results.push({ name, url, health: health.status(), healthJson, title, h1, screenshot: path.join(outDir, `${stamp}-${name}-desktop.png`) });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
