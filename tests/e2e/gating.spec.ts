import { test, expect } from '@playwright/test';

const COURSE = '/courses/catalan-a1';

/* Logged-out behaviour: catalog, redirects, free preview, paywall, auth
   pages. Needs no Supabase — everything here is the unauthenticated path. */

test.describe('catalog', () => {
  test('renders the course card with buy + free preview, logged-out header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-test="catalog"]')).toHaveCount(1);
    await expect(page.locator('[data-test="course-catalan-a1"] .buy-btn')).toHaveCount(1);
    await expect(page.locator('[data-test="free-preview"]')).toHaveAttribute('href', /\/unit\/1$/);
    await expect(page.locator('[data-test="header-login"]')).toBeVisible();
    await expect(page.locator('[data-test="header-signup"]')).toBeVisible();
  });
});

test.describe('redirects from the old root URLs', () => {
  for (const [from, to] of [
    ['/unit/3', `${COURSE}/unit/3`],
    ['/ipa', `${COURSE}/ipa`],
    ['/exam', `${COURSE}/exam`],
    ['/mock', `${COURSE}/mock`],
    ['/glossary', `${COURSE}/glossary`],
  ]) {
    test(`${from} → ${to}`, async ({ page }) => {
      await page.goto(from);
      expect(new URL(page.url()).pathname).toBe(to);
    });
  }
});

test.describe('free preview (unit 1)', () => {
  test('is fully usable without an account and saves progress locally', async ({ page }) => {
    await page.goto(`${COURSE}/unit/1`);
    await expect(page.locator('[data-test="preview-banner"]')).toBeVisible();
    await expect(page.locator('.ex[data-ex]')).toHaveCount(6);

    const wr = page.locator('.ex[data-ex="1.2"]');
    for (const [n, v] of [[1, 'llibre'], [2, 'hola'], [3, 'cafè'], [4, 'maig']] as const) {
      await wr.locator(`li:nth-child(${n}) .gap-input`).fill(v);
    }
    await wr.locator('.btn-primary').click();
    await expect(wr.locator('.ex-score')).toContainText('4 / 4');

    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cfs.catalan-a1.ex.1.2') || '{}').state);
    expect(state).toBe('passed');
  });
});

test.describe('paywall', () => {
  for (const path of ['unit/2', 'unit/12', 'mock', 'glossary']) {
    test(`${path} is gated with no leaked content`, async ({ page }) => {
      await page.goto(`${COURSE}/${path}`);
      await expect(page.locator('[data-test="paywall"]')).toHaveCount(1);
      await expect(page.locator('.ex[data-ex]')).toHaveCount(0);
    });
  }

  test('the paywall offers a buy button', async ({ page }) => {
    await page.goto(`${COURSE}/unit/2`);
    await expect(page.locator('[data-test="paywall"] .buy-btn')).toBeVisible();
  });

  test('IPA guide and exam info stay free', async ({ page }) => {
    await page.goto(`${COURSE}/ipa`);
    await expect(page.locator('.card').first()).toContainText('IPA');
    await page.goto(`${COURSE}/exam`);
    await expect(page.locator('[data-test="paywall"]')).toHaveCount(0);
  });

  test('sidebar locks units 2–12 and offers log in', async ({ page }) => {
    await page.goto(`${COURSE}/unit/1`);
    await expect(page.locator('.nav-units .nav-lock')).toHaveCount(11);
    await expect(page.locator('[data-test="nav-login"]')).toBeVisible();
  });

  test('course home shows the sales page, not the dashboard', async ({ page }) => {
    await page.goto(COURSE);
    await expect(page.locator('[data-test="sales-page"]')).toHaveCount(1);
    await expect(page.locator('#overallStats')).toHaveCount(0);
  });
});

test.describe('API guards', () => {
  test('POST /api/checkout requires login (401)', async ({ page }) => {
    await page.goto('/');
    const status = await page.evaluate(async () => {
      const r = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: 'catalan-a1' }),
      });
      return r.status;
    });
    expect(status).toBe(401);
  });

  test('the Paddle webhook rejects unsigned payloads (401)', async ({ page }) => {
    await page.goto('/');
    const status = await page.evaluate(async () => {
      const r = await fetch('/api/webhooks/paddle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'transaction.completed' }),
      });
      return r.status;
    });
    expect(status).toBe(401);
  });
});

test.describe('auth pages', () => {
  test('login, signup and forgot-password forms render; /account redirects', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-test="auth-login"] input[type="email"]')).toHaveCount(1);
    await expect(page.locator('.auth-google')).toHaveCount(1);
    await page.goto('/signup');
    await expect(page.locator('[data-test="auth-signup"] input[type="password"]')).toHaveCount(1);
    await page.goto('/forgot-password');
    await expect(page.locator('[data-test="auth-forgot"]')).toHaveCount(1);
    await page.goto('/account');
    expect(new URL(page.url()).pathname).toBe('/login');
  });
});

test.describe('mobile @ 380px', () => {
  test.use({ viewport: { width: 380, height: 740 } });
  for (const [label, path] of [['paywall', `${COURSE}/unit/2`], ['catalog', '/'], ['login', '/login']]) {
    test(`no horizontal scroll on ${label}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
