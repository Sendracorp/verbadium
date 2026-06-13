import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BASE_URL } from '../../playwright.config';
import { adminClient, createOwner, deleteOwner, supabaseConfigured, type TestOwner } from './supabase';

type WorkerFixtures = {
  admin: SupabaseClient;
  /** A confirmed, course-owning user plus a logged-in storage state,
      created once per worker and reused across its tests. */
  owner: TestOwner & { storageState: Awaited<ReturnType<BrowserContext['storageState']>> };
};

type TestFixtures = {
  /** A fresh page already authenticated as the worker's owner. */
  ownerPage: Page;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  admin: [async ({}, use) => { await use(adminClient()); }, { scope: 'worker' }],

  owner: [async ({ admin, browser }, use, workerInfo) => {
    const o = await createOwner(admin, workerInfo.workerIndex);
    // Log in once through the real UI, then snapshot the session cookies.
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await page.goto('/login');
    await page.fill('input[type="email"]', o.email);
    await page.fill('input[type="password"]', o.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20_000 });
    const storageState = await ctx.storageState();
    await ctx.close();

    await use({ ...o, storageState });
    await deleteOwner(admin, o.userId);
  }, { scope: 'worker' }],

  ownerPage: async ({ browser, owner }, use) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL, storageState: owner.storageState });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect, supabaseConfigured };
