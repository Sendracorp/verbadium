import { test, expect, supabaseConfigured } from '../helpers/fixtures';

const COURSE = '/courses/catalan-a1';

/* Exercise engine, glossary, native audio, mock exam, IPA drawer and mobile —
   exercised as a logged-in course owner (so all 12 units are reachable
   without the COURSE_BYPASS_PAYWALL crutch). Progress now lives server-side,
   so state is asserted from the UI, not localStorage. */
test.describe('course content (owner)', () => {
  test.skip(!supabaseConfigured, 'Supabase credentials not configured (.env.local)');

  test('fidelity counts render', async ({ ownerPage: page }) => {
    await page.goto(COURSE);
    await expect(page.locator('.unit-card')).toHaveCount(12);
    await expect(page.locator('#overallStats')).toContainText('of 83 exercises');
    await page.goto(`${COURSE}/glossary`);
    await expect(page.locator('#glosTable tbody tr')).toHaveCount(275);
  });

  test('gap-fill marks exact answers, flags missing accents, persists pass', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/2`);
    const gap = page.locator('.ex[data-ex="2.1"]');
    for (const [i, v] of ['soc', 'ets', 'es', 'som', 'són', 'sou'].entries()) {  // item 3 missing accent
      await gap.locator('.gap-input').nth(i).fill(v);
    }
    await gap.locator('.btn-primary').click();
    await expect(gap.locator('.gap-input.ok')).toHaveCount(5);
    await expect(gap.locator('.gap-input.almost')).toHaveCount(1);
    await expect(gap.locator('.ex-score')).toContainText('6 / 6');
    await expect(gap.locator('.ex-state.passed')).toHaveCount(1);
  });

  test('matching, reorder, model and free exercises work', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/2`);

    const match = page.locator('.ex[data-ex="2.2"]');
    for (const [l, r] of [['0', 'b'], ['1', 'd'], ['2', 'a'], ['3', 'c']]) {
      await match.locator(`.match-item[data-side="l"][data-key="${l}"]`).click();
      await match.locator(`.match-item[data-side="r"][data-key="${r}"]`).click();
    }
    await match.locator('.btn-primary').click();
    await expect(match.locator('.match-item.ok')).toHaveCount(4);

    const re = page.locator('.ex[data-ex="2.4"] .reorder[data-item="0"]');
    for (const tok of ['Em', 'dic', 'Marc', '.']) {
      await re.locator('.reorder-pool .chip', { hasText: new RegExp('^' + tok.replace('.', '\\.') + '$') }).click();
    }
    await expect(re.locator('.reorder-out')).toHaveText('Em dic Marc.');
    await page.locator('.ex[data-ex="2.4"] .btn-primary').click();
    await expect(re.locator('.reorder-out.ok')).toHaveCount(1);

    const model = page.locator('.ex[data-ex="2.3"]');
    await model.locator('.model-input').first().fill('Bon dia! Com estàs?');
    await model.locator('.ex-controls .btn:not(.btn-primary)').first().click();
    await expect(model.locator('.model-answer')).toBeVisible();
    const yes = model.locator('.sm-yes');
    for (let i = 0; i < await yes.count(); i++) await yes.nth(i).click();
    await expect(model.locator('.ex-score')).toContainText('4 / 4');

    const free = page.locator('.ex[data-ex="2.8"]');
    await free.locator('.free-text').fill('Hola! Em dic QA. Soc de Testlàndia.');
    await free.locator('.ex-controls .btn:not(.btn-primary)').first().click();
    await free.locator('.sm-yes').click();
    await expect(free.locator('.ex-state.passed')).toHaveCount(1);
  });

  test('the accent char strip inserts ç', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/2`);
    const input = page.locator('.ex[data-ex="2.1"] .gap-input').first();
    await input.click();
    await expect(page.locator('.char-strip.visible')).toHaveCount(1);
    await page.locator('.char-strip button', { hasText: 'ç' }).click();
    expect(await input.inputValue()).toContain('ç');
  });

  test('true/false and accent-lenient write (unit 1)', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/1`);
    const tf = page.locator('.ex[data-ex="1.4"]');
    await tf.locator('[data-item="0"] .tf-btn[data-val="true"]').click();
    await tf.locator('[data-item="1"] .tf-btn[data-val="true"]').click();
    await expect(tf.locator('[data-item="0"] .tf-btn.ok')).toHaveCount(1);
    await expect(tf.locator('[data-item="1"] .tf-btn.bad')).toHaveCount(1);

    const wr = page.locator('.ex[data-ex="1.2"]');
    for (const [n, v] of [[1, 'llibre'], [2, 'hola'], [3, 'cafe'], [4, 'maig']] as const) {
      await wr.locator(`li:nth-child(${n}) .gap-input`).fill(v);
    }
    await wr.locator('.btn-primary').click();
    await expect(wr.locator('.ex-score')).toContainText('4 / 4');
    await expect(wr.locator('.gap-input.almost')).toHaveCount(1);
  });

  test('choice (unit 8) and paradigm (unit 5)', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/8`);
    const ch = page.locator('.ex[data-ex="8.4"]');
    await ch.locator('[data-item="0"] .tf-btn[data-val="beguda"]').click();
    await expect(ch.locator('[data-item="0"] .tf-btn.ok')).toHaveCount(1);

    await page.goto(`${COURSE}/unit/5`);
    const pa = page.locator('.ex[data-ex="5.4"]');
    for (const [i, v] of ['compro', 'compres', 'compra', 'comprem', 'compreu', 'compren'].entries()) {
      await pa.locator('.gap-input').nth(i).fill(v);
    }
    await pa.locator('.btn-primary').click();
    await expect(pa.locator('.ex-score')).toContainText('6 / 6');
    await expect(pa.locator('.paradigm-ipa').first()).toContainText('ˈkompɾu');
  });

  test('glossary search, sort, and native-speaker audio', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/glossary`);
    await page.fill('#glosSearch', 'formatge');
    expect(await page.locator('#glosTable tbody tr').count()).toBeLessThan(10);
    await page.fill('#glosSearch', '');
    await page.click('th[data-sort="3"]');
    await expect(page.locator('#glosTable tbody tr:first-child td:last-child')).toHaveText('1');

    await expect(page.locator('.audio-credits')).toContainText('CC BY-SA');
    await page.fill('#glosSearch', 'formatge');
    await page.locator('#glosTable tbody tr', { hasText: 'cheese' }).locator('.say').click();
    expect(await page.evaluate(() => window.__audioMode)).toBe('native');

    await page.fill('#glosSearch', 'abril');
    await page.locator('#glosTable tbody tr', { hasText: 'maig' }).locator('.say').click();
    expect(await page.evaluate(() => window.__audioMode)).toBe('native');

    // sentences now have pre-generated Google TTS clips (scripts/generate-tts.mjs),
    // so they play a static file (native mode) instead of browser Web Speech TTS
    await page.fill('#glosSearch', 'Quants anys tens');
    await page.locator('#glosTable tbody tr').first().locator('.say').click();
    expect(await page.evaluate(() => window.__audioMode)).toBe('native');
  });

  test('mock exam: listening, auto-marking, timers, attempt history', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/mock`);
    await expect(page.locator('.script-text')).toBeHidden();
    const key = [false, true, false, true, false, false];
    for (let i = 0; i < 6; i++) {
      await page.locator(`#paper1 [data-item="${i}"] .tf-btn[data-val="${key[i]}"]`).click();
    }
    await expect(page.locator('#p1controls .ex-score')).toContainText('6 / 6');
    await page.click('#showScript');
    await expect(page.locator('.script-text')).toBeVisible();

    for (const [l, r] of [['0', 'b'], ['1', 'd'], ['2', 'a'], ['3', 'e'], ['4', 'c']]) {
      await page.locator(`#p2b .match-item[data-side="l"][data-key="${l}"]`).click();
      await page.locator(`#p2b .match-item[data-side="r"][data-key="${r}"]`).click();
    }
    await page.locator('#p2b .btn-primary').click();
    await expect(page.locator('#p2b .ex-score')).toContainText('5 / 5');

    await page.check('#examConditions');
    await page.locator('.paper-timer[data-paper="1"] .timer-start').click();
    await expect(page.locator('.paper-timer[data-paper="1"] .timer-display')).toContainText(/1[45]:\d\d/);

    page.once('dialog', d => d.accept());
    await page.click('#saveAttempt');
    await page.reload();
    await expect(page.locator('#attemptHistory')).toContainText('6/6');
  });

  test('IPA quick-reference drawer opens and closes', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/5`);
    await expect(page.locator('#ipaTab')).toBeVisible();
    await page.click('#ipaTab');
    await expect(page.locator('#ipaDrawer')).toContainText('Vowels');
    await page.keyboard.press('Escape');
    await expect.poll(() => page.locator('#ipaDrawer').evaluate(
      el => el.getBoundingClientRect().left >= window.innerWidth - 2)).toBe(true);
  });

  test('reset clears server-side progress', async ({ ownerPage: page }) => {
    await page.goto(`${COURSE}/unit/2`);
    const gap = page.locator('.ex[data-ex="2.1"]');
    for (const [i, v] of ['soc', 'ets', 'es', 'som', 'són', 'sou'].entries()) {
      await gap.locator('.gap-input').nth(i).fill(v);
    }
    await gap.locator('.btn-primary').click();
    await expect(gap.locator('.ex-score')).toContainText('6 / 6');

    await page.goto(COURSE);
    page.once('dialog', d => d.accept());
    await page.click('#resetProgress');
    await expect(page.locator('#overallStats')).toContainText('0 of 83');
    await page.reload();
    await expect(page.locator('#overallStats')).toContainText('0 of 83');
  });

  test.describe('mobile @ 380px', () => {
    test.use({ viewport: { width: 380, height: 740 } });
    test('unit page: hamburger nav, no horizontal scroll, exercise works', async ({ ownerPage: page }) => {
      await page.goto(`${COURSE}/unit/3`);
      await expect(page.locator('#navToggle')).toBeVisible();   // floating course-menu button
      await page.click('#navToggle');
      await expect.poll(() => page.locator('#sidebar').evaluate(el => el.getBoundingClientRect().left >= 0 && el.getBoundingClientRect().left < 60)).toBe(true);
      await page.locator('#backdrop').click({ position: { x: 360, y: 120 } });  // right sliver, clear of the side tabs
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      const g = page.locator('.ex[data-ex="3.1"] .gap-input').first();
      await g.scrollIntoViewIfNeeded();
      await g.fill('tinc');
      await page.locator('.ex[data-ex="3.1"] .btn-primary').click();
      await expect(page.locator('.ex[data-ex="3.1"] .gap-input.ok').first()).toBeVisible();
    });
  });
});
