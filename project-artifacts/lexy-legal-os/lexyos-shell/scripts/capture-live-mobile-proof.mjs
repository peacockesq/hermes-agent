import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('proof', 'mobile-regression-fix');
await fs.mkdir(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 2, isMobile: true });
await page.goto('https://os.lexyalgo.com/', { waitUntil: 'networkidle' });
const loginPath = path.join(outDir, `${stamp}-live-mobile-login.png`);
await page.screenshot({ path: loginPath, fullPage: true });
await page.getByRole('button', { name: 'Continue with Google Workspace' }).click();
await page.waitForSelector('#mobile-menu-toggle');
const appPath = path.join(outDir, `${stamp}-live-mobile-app.png`);
await page.screenshot({ path: appPath, fullPage: true });
await page.getByRole('button', { name: '☰' }).click();
await page.waitForSelector('body.nav-open');
const menuPath = path.join(outDir, `${stamp}-live-mobile-menu-open.png`);
await page.screenshot({ path: menuPath, fullPage: true });
await page.getByRole('button', { name: 'Eva' }).first().click();
await page.waitForSelector('body.agent-open');
const evaPath = path.join(outDir, `${stamp}-live-mobile-eva-open.png`);
await page.screenshot({ path: evaPath, fullPage: true });
const proof = await page.evaluate(() => ({
  title: document.title,
  loginHidden: document.querySelector('#login-screen')?.hidden,
  appHidden: document.querySelector('#app-shell')?.hidden,
  mobileMenu: Boolean(document.querySelector('#mobile-menu-toggle')),
  evaBubble: Boolean(document.querySelector('#eva-bubble')),
  bodyClass: document.body.className,
}));
await browser.close();
console.log(JSON.stringify({ proof, screenshots: { loginPath, appPath, menuPath, evaPath } }, null, 2));
