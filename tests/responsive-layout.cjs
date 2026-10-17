/* Browser responsive smoke tests for critical GoCamp routes.
   Run with: node tests/responsive-layout.cjs (Playwright installed). */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const widths = [320, 390, 768, 820, 1024, 1180, 1440];
const routes = [
  '/', '/about', '/contact', '/faq', '/programs',
  '/destinations/uk', '/destinations/switzerland',
  '/program/category?category=adult-academic', '/landing', '/admin'
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      for (const route of routes) {
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (!response || response.status() !== 200) {
          errors.push(`${width}px ${route}: HTTP ${response?.status() || 'no response'}`);
          continue;
        }
        const result = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth;
          const overflowing = [...document.querySelectorAll(
            '.container, .container-fluid, .card, .form-control, .form-select, .modal.show, .navbar, #main-content'
          )].filter(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && (rect.right > viewport + 4 || rect.left < -4);
          }).slice(0, 4).map(el => `${el.tagName.toLowerCase()}.${String(el.className).replace(/\\s+/g, '.')}`);
          const buttons = [...document.querySelectorAll('.page-content .btn, #main-content .btn, .navbar .btn')].filter(el => {
            const cs = getComputedStyle(el);
            return cs.display !== 'none' && el.getBoundingClientRect().width > 0;
          });
          const invalidButtons = buttons.filter(el => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return !Number.isFinite(r.height) || r.height < 30 || !parseFloat(cs.borderRadius);
          }).slice(0, 4).map(el => el.textContent.trim().slice(0, 30));
          return {
            scrollWidth: document.documentElement.scrollWidth,
            viewport,
            overflowing,
            invalidButtons,
            togglerVisible: (() => {
              const nav = document.querySelector('.navbar-toggler');
              return nav && getComputedStyle(nav).display !== 'none';
            })()
          };
        });
        if (result.scrollWidth > result.viewport + 4)
          errors.push(`${width}px ${route}: document overflow ${result.scrollWidth - result.viewport}px`);
        if (result.overflowing.length)
          errors.push(`${width}px ${route}: components overflow: ${result.overflowing.join(', ')}`);
        if (result.invalidButtons.length)
          errors.push(`${width}px ${route}: inconsistent button geometry: ${result.invalidButtons.join(', ')}`);
        if (result.togglerVisible !== (width < 1200))
          errors.push(`${width}px ${route}: tablet navbar breakpoint wrong`);
      }
      if ([390, 820, 1024, 1440].includes(width)) {
        await page.goto(base + '/destinations/uk', { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: `/tmp/gocamp-${width}.png`, fullPage: true });
      }
      await page.close();
      console.log(`Checked ${width}px across ${routes.length} routes`);
    }
  } finally {
    await browser.close();
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Responsive layout smoke tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
