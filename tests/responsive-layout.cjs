/* Browser responsive smoke tests for critical GoCamp routes.
   Run with: node tests/responsive-layout.cjs (Playwright installed). */
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const widths = [320, 390, 768, 820, 1024, 1180, 1440];
// Fetch public destinations and categories from the same PHP catalogs used by the app.
const catalog = JSON.parse(execFileSync('php', [path.join(__dirname, 'public-catalog-routes.php')], { encoding: 'utf8' }));
const routes = [...new Set([
  '/', '/about', '/contact', '/faq', '/landing', '/admin',
  ...catalog.destinations, ...catalog.categories
])];
const screenshotRoute = catalog.screenshotDestination || catalog.destinations[0] || '/';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined, args: ['--no-sandbox'] });
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
          const viewport = window.innerWidth; // clientWidth excludes scrollbar gutter on Linux
          // A slide's DOM rectangle can be outside the viewport while its pixels
          // remain clipped inside a correctly sized scroll container. Inspect the
          // visible horizontal extent instead of exempting any component class.
          function visibleHorizontalBounds(el) {
            const rect = el.getBoundingClientRect();
            let left = rect.left;
            let right = rect.right;
            for (let parent = el.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
              if (!['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(parent).overflowX)) continue;
              const bounds = parent.getBoundingClientRect();
              const clipLeft = bounds.left + parent.clientLeft;
              left = Math.max(left, clipLeft);
              right = Math.min(right, clipLeft + parent.clientWidth);
            }
            return { left, right, width: Math.max(0, right - left) };
          }
          function overflowsViewport(el, tolerance) {
            const bounds = visibleHorizontalBounds(el);
            return bounds.width > 0 && (bounds.right > viewport + tolerance || bounds.left < -tolerance);
          }
          const overflowing = [...document.querySelectorAll(
            '.container, .container-fluid, .card, .form-control, .form-select, .modal.show, .navbar, #main-content'
          )].filter(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            return overflowsViewport(el, 4);
          }).slice(0, 4).map(el => `${el.tagName.toLowerCase()}.${String(el.className).replace(/\\s+/g, '.')}`);
          const offenders = [...document.querySelectorAll('body *')].filter(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.position === 'fixed') return false;
            return overflowsViewport(el, 3);
          }).sort((a,b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right).slice(0, 5).map(el => {
            const r = el.getBoundingClientRect();
            return `${el.tagName.toLowerCase()}#${el.id}.${String(el.className).replace(/\\s+/g, '.')}(right=${Math.round(r.right)},width=${Math.round(r.width)})`;
          });
          const buttons = [...document.querySelectorAll('.page-content .btn, #main-content .btn, .navbar .btn')].filter(el => {
            const cs = getComputedStyle(el);
            return cs.display !== 'none' && el.getBoundingClientRect().width > 0;
          });
          const invalidButtons = buttons.filter(el => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return !Number.isFinite(r.height) || r.height < 30 || !parseFloat(cs.borderRadius);
          }).slice(0, 4).map(el => el.textContent.trim().slice(0, 30));
          // Regression guard: clipping must hide a child, but must not hide
          // overflow of the scroll container itself or ordinary page elements.
          const fixture = document.createElement('div');
          fixture.style.cssText = 'position:absolute;left:10px;top:0;width:100px;height:10px;overflow-x:auto';
          const child = document.createElement('div');
          child.style.cssText = `margin-left:${viewport}px;width:40px;height:10px`;
          fixture.append(child);
          document.body.append(fixture);
          const clippedChildPasses = !overflowsViewport(child, 4);
          fixture.style.left = `${viewport + 20}px`;
          const overflowingContainerFails = overflowsViewport(fixture, 4);
          fixture.style.overflowX = 'visible';
          const unclippedChildFails = overflowsViewport(child, 4);
          fixture.remove();
          return {
            scrollWidth: document.documentElement.scrollWidth,
            viewport,
            overflowing,
            offenders,
            invalidButtons,
            clippingChecksPass: clippedChildPasses && overflowingContainerFails && unclippedChildFails,
            togglerVisible: (() => {
              const nav = document.querySelector('.navbar-toggler');
              return nav ? getComputedStyle(nav).display !== 'none' : null;
            })()
          };
        });
        if (!result.clippingChecksPass)
          errors.push(`${width}px ${route}: overflow detector clipping regression`);
        if (result.scrollWidth > result.viewport + 4)
          errors.push(`${width}px ${route}: document overflow ${result.scrollWidth - result.viewport}px; offenders=${result.offenders.join(', ')}`);
        if (result.overflowing.length)
          errors.push(`${width}px ${route}: components overflow: ${result.overflowing.join(', ')}`);
        if (result.invalidButtons.length)
          errors.push(`${width}px ${route}: inconsistent button geometry: ${result.invalidButtons.join(', ')}`);
        if (result.togglerVisible !== null && result.togglerVisible !== (width < 1200))
          errors.push(`${width}px ${route}: tablet navbar breakpoint wrong`);
      }
      // Check the scroll container and actual navigation at each viewport size.
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const track = page.locator('.camp-memories-track');
      if (await track.count()) {
        await page.locator('[data-memories-direction="1"]').waitFor({ state: 'visible' });
        const previous = page.locator('[data-memories-direction="-1"]');
        const next = page.locator('[data-memories-direction="1"]');
        const count = await track.locator('.camp-memory').count();
        if (!(await previous.isDisabled())) errors.push(`${width}px slider: previous should start disabled`);
        for (let slide = 0; slide < count && !(await next.isDisabled()); slide++) {
          await next.click();
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        }
        if (!(await next.isDisabled())) errors.push(`${width}px slider: next did not reach the last photo`);
        const lastPhotoVisible = await track.evaluate(el => {
          const last = el.lastElementChild.getBoundingClientRect();
          const bounds = el.getBoundingClientRect();
          return last.right <= bounds.right + 2 && last.left >= bounds.left - 2;
        });
        if (!lastPhotoVisible) errors.push(`${width}px slider: last photo is not fully visible`);
        for (let slide = 0; slide < count && !(await previous.isDisabled()); slide++) {
          await previous.click();
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        }
        if (!(await previous.isDisabled())) errors.push(`${width}px slider: previous did not return to the first photo`);
        const contained = await track.evaluate(el => {
          const bounds = el.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth + 4;
        });
        if (!contained) errors.push(`${width}px slider: track or document exceeds viewport`);
      }
      if ([390, 820, 1024, 1440].includes(width)) {
        await page.goto(base + screenshotRoute, { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: path.join(os.tmpdir(), `gocamp-${width}.png`), fullPage: true });
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
