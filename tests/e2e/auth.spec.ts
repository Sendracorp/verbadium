import { test, expect, supabaseConfigured } from '../helpers/fixtures';

const COURSE = '/courses/catalan-a1';

/* Real auth + ownership + server-side progress against the live Supabase.
   Skipped (not failed) when credentials are placeholders. */
test.describe('authenticated flows', () => {
  test.skip(!supabaseConfigured, 'Supabase credentials not configured (.env.local)');

  test('the signup trigger created a profile row for the owner', async ({ admin, owner }) => {
    const { data } = await admin.from('profiles').select('email, is_admin').eq('id', owner.userId).maybeSingle();
    expect(data?.email).toBe(owner.email);
    expect(data?.is_admin).toBe(false);
  });

  test('logging in through the form lands on the catalog', async ({ browser, owner }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/login');
    await page.fill('input[type="email"]', owner.email);
    await page.fill('input[type="password"]', owner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(u => !u.pathname.startsWith('/login'));
    await expect(page.locator('[data-test="account-menu"]')).toBeVisible();
    await page.click('[data-test="account-menu"]');
    await expect(page.locator('[data-test="account-email"]')).toContainText(owner.email);
    await ctx.close();
  });

  test('ownership unlocks a gated unit (no paywall)', async ({ ownerPage }) => {
    await ownerPage.goto(`${COURSE}/unit/2`);
    await expect(ownerPage.locator('[data-test="paywall"]')).toHaveCount(0);
    await expect(ownerPage.locator('.ex[data-ex]').first()).toBeVisible();
  });

  test('exercise progress is written to the database and restored on reload', async ({ ownerPage, owner, admin }) => {
    await ownerPage.goto(`${COURSE}/unit/2`);
    const gap = ownerPage.locator('.ex[data-ex="2.1"]');
    for (const [i, v] of ['soc', 'ets', 'és', 'som', 'són', 'sou'].entries()) {
      await gap.locator('.gap-input').nth(i).fill(v);
    }
    await gap.locator('.btn-primary').click();
    await expect(gap.locator('.ex-score')).toContainText('6 / 6');

    // persisted to Postgres (poll: the push queue flushes asynchronously)
    await expect.poll(async () => {
      const { data } = await admin.from('exercise_progress')
        .select('state').eq('user_id', owner.userId).eq('course_slug', 'catalan-a1')
        .eq('exercise_id', '2.1').maybeSingle();
      return data?.state ?? null;
    }, { timeout: 10_000 }).toBe('passed');

    // restored from the server on a fresh load
    await ownerPage.goto(`${COURSE}/unit/2`);
    await expect(gap.locator('.ex-state.passed')).toHaveCount(1);
  });

  test('the dashboard reflects server-side progress', async ({ ownerPage }) => {
    // make sure there is at least one pass for this owner first
    await ownerPage.goto(`${COURSE}/unit/2`);
    const gap = ownerPage.locator('.ex[data-ex="2.1"]');
    if (await gap.locator('.ex-state.passed').count() === 0) {
      for (const [i, v] of ['soc', 'ets', 'és', 'som', 'són', 'sou'].entries()) {
        await gap.locator('.gap-input').nth(i).fill(v);
      }
      await gap.locator('.btn-primary').click();
      await expect(gap.locator('.ex-score')).toContainText('6 / 6');
    }
    await ownerPage.goto(COURSE);
    await expect(ownerPage.locator('#overallStats')).toContainText(/[1-9]\d* of 83 exercises passed/);
  });
});
