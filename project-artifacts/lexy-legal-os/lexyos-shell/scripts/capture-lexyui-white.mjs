import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const targets = [
  ['staging', 'http://37.27.49.209:5174/'],
  ['live', 'http://37.27.49.209:5175/'],
];
const viewports = [
  ['desktop', { width: 1440, height: 1100, deviceScaleFactor: 1, isMobile: false }],
  ['mobile', { width: 390, height: 1200, deviceScaleFactor: 2, isMobile: true }],
];

const outDir = path.resolve('proof', 'screenshots-lexyui-white');
await fs.mkdir(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, url] of targets) {
  const healthUrl = url.replace(/\/$/, '/api/health');
  for (const [viewportName, viewport] of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile });
    const health = await page.request.get(healthUrl);
    const healthJson = await health.json().catch(() => null);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const screenshot = path.join(outDir, `${stamp}-${name}-${viewportName}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent().catch(() => null);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    results.push({ name, viewport: viewportName, url, health: health.status(), healthJson, title, h1, bodyBackground: bg, screenshot });
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
