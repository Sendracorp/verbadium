/* QA: paywall gating, redirects and auth pages — run against a server
   WITHOUT COURSE_BYPASS_PAYWALL (and typically without real Supabase creds:
   everything must behave as "logged out").
   Usage: node gating.test.js [baseURL]   (default http://localhost:3000/) */
'use strict';
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3000/').replace(/\/?$/, '/');
const COURSE = BASE + 'courses/catalan-a1/';
let failures = 0;
function ok(cond, label) {
  console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + label);
  if (!cond) failures++;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => { console.log('  ✗ PAGE ERROR: ' + e.message); failures++; });

  console.log('BASE = ' + BASE);

  // ---------- catalog ----------
  console.log('catalog');
  await page.goto(BASE);
  ok(await page.locator('[data-test="catalog"]').count() === 1, 'catalog grid renders');
  ok(await page.locator('[data-test="course-catalan-a1"]').count() === 1, 'Catalan A1 course card present');
  ok(await page.locator('[data-test="course-catalan-a1"] .buy-btn').count() === 1, 'buy button on course card');
  ok((await page.locator('[data-test="free-preview"]').getAttribute('href')).includes('/unit/1'), 'free-preview link → unit 1');
  ok(await page.locator('[data-test="header-login"]').isVisible(), 'header shows Log in when logged out');
  ok(await page.locator('[data-test="header-signup"]').isVisible(), 'header shows Sign up when logged out');

  // ---------- old URLs redirect ----------
  console.log('redirects');
  for (const [from, to] of [
    ['unit/3', 'courses/catalan-a1/unit/3'],
    ['ipa', 'courses/catalan-a1/ipa'],
    ['exam', 'courses/catalan-a1/exam'],
    ['mock', 'courses/catalan-a1/mock'],
    ['glossary', 'courses/catalan-a1/glossary'],
  ]) {
    await page.goto(BASE + from);
    ok(page.url().includes(to), `/${from} redirects to /${to}`);
  }

  // ---------- free preview ----------
  console.log('free preview (unit 1)');
  await page.goto(COURSE + 'unit/1');
  ok(await page.locator('[data-test="preview-banner"]').isVisible(), 'preview banner shown');
  ok(await page.locator('.ex[data-ex]').count() === 6, 'unit 1 exercises render without purchase');
  const u1 = page.locator('.ex[data-ex="1.2"]');
  await u1.locator('li:nth-child(1) .gap-input').fill('llibre');
  await u1.locator('li:nth-child(2) .gap-input').fill('hola');
  await u1.locator('li:nth-child(3) .gap-input').fill('cafè');
  await u1.locator('li:nth-child(4) .gap-input').fill('maig');
  await u1.locator('.btn-primary').click();
  ok((await u1.locator('.ex-score').textContent()).includes('4 / 4'), 'preview exercise checks answers');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cfs.catalan-a1.ex.1.2')).state);
  ok(saved === 'passed', 'preview progress saved locally (logged out)');

  // ---------- gated content ----------
  console.log('paywall');
  for (const path of ['unit/2', 'unit/12', 'mock', 'glossary']) {
    await page.goto(COURSE + path);
    ok(await page.locator('[data-test="paywall"]').count() === 1, `${path} shows paywall`);
    ok(await page.locator('.ex[data-ex]').count() === 0, `${path} renders no exercise content`);
  }
  ok(await page.locator('[data-test="paywall"] .buy-btn').isVisible(), 'paywall has buy button');
  // free pages stay open
  await page.goto(COURSE + 'ipa');
  ok((await page.locator('.card').first().textContent()).includes('IPA'), 'IPA guide stays free');
  await page.goto(COURSE + 'exam');
  ok(await page.locator('[data-test="paywall"]').count() === 0, 'exam info stays free');

  // sidebar locks
  await page.goto(COURSE + 'unit/1');
  const locks = await page.locator('.nav-units .nav-lock').count();
  ok(locks === 11, 'sidebar: 11 locked unit badges (got ' + locks + ')');
  ok(await page.locator('[data-test="nav-login"]').isVisible(), 'sidebar shows Log in link');

  // course home shows the sales page, not the dashboard
  await page.goto(COURSE);
  ok(await page.locator('[data-test="sales-page"]').count() === 1, 'course home shows sales page when not owned');
  ok(await page.locator('#overallStats').count() === 0, 'no progress dashboard when not owned');

  // ---------- checkout API requires login ----------
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseSlug: 'catalan-a1' }),
    });
    return r.status;
  });
  ok(status === 401, 'POST /api/checkout → 401 when logged out (got ' + status + ')');

  // webhook rejects unsigned payloads
  const whStatus = await page.evaluate(async () => {
    const r = await fetch('/api/webhooks/lemonsqueezy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { event_name: 'order_created' } }),
    });
    return r.status;
  });
  ok(whStatus === 401, 'unsigned webhook rejected with 401 (got ' + whStatus + ')');

  // ---------- auth pages ----------
  console.log('auth pages');
  await page.goto(BASE + 'login');
  ok(await page.locator('[data-test="auth-login"] input[type="email"]').count() === 1, 'login form renders');
  ok(await page.locator('.auth-google').count() === 1, 'Google button on login');
  await page.goto(BASE + 'signup');
  ok(await page.locator('[data-test="auth-signup"] input[type="password"]').count() === 1, 'signup form renders');
  await page.goto(BASE + 'forgot-password');
  ok(await page.locator('[data-test="auth-forgot"]').count() === 1, 'forgot-password form renders');
  await page.goto(BASE + 'account');
  ok(page.url().includes('/login'), '/account redirects to /login when logged out');

  // ---------- mobile 380px ----------
  console.log('mobile 380px');
  const mob = await browser.newPage({ viewport: { width: 380, height: 740 } });
  mob.on('pageerror', e => { console.log('  ✗ MOBILE PAGE ERROR: ' + e.message); failures++; });
  await mob.goto(COURSE + 'unit/2');
  ok(await mob.locator('[data-test="paywall"]').isVisible(), 'mobile: paywall renders');
  let hscroll = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(hscroll <= 1, 'mobile: no horizontal scroll on paywall (overflow ' + hscroll + 'px)');
  await mob.goto(BASE);
  hscroll = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(hscroll <= 1, 'mobile: no horizontal scroll on catalog (overflow ' + hscroll + 'px)');
  await mob.goto(BASE + 'login');
  hscroll = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(hscroll <= 1, 'mobile: no horizontal scroll on login (overflow ' + hscroll + 'px)');

  await browser.close();
  console.log(failures === 0 ? '\nALL GATING TESTS PASSED' : '\n' + failures + ' FAILURES');
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
