/* QA: drives the Next.js site with headless Chromium.
   Usage: node test.js [baseURL]   (default http://localhost:3000/ — run `next start` first) */
'use strict';
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3000/').replace(/\/?$/, '/');
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

  // ---------- fidelity counts in the rendered site ----------
  console.log('counts');
  await page.goto(BASE);
  ok(await page.locator('.nav-unit').count() === 12, '12 unit links in nav');
  ok(await page.locator('.unit-card').count() === 12, '12 unit cards on the dashboard');
  ok((await page.locator('#overallStats').textContent()).includes('of 83 exercises'), 'dashboard reports 83 exercises');
  ok(await page.locator('.check-item').count() === 15, '15 checklist items');

  let domEx = 0;
  for (let u = 1; u <= 12; u++) {
    await page.goto(BASE + 'unit/' + u);
    domEx += await page.locator('.ex[data-ex]').count();
  }
  ok(domEx === 83, '83 exercise blocks rendered across unit pages (got ' + domEx + ')');

  await page.goto(BASE + 'glossary');
  ok(await page.locator('#glosTable tbody tr').count() === 275, '275 glossary rows rendered');

  // ---------- glossary search + sort ----------
  console.log('glossary');
  await page.fill('#glosSearch', 'formatge');
  const visible = await page.locator('#glosTable tbody tr').count();
  ok(visible >= 1 && visible < 10, 'search filters rows (formatge → ' + visible + ')');
  await page.fill('#glosSearch', '');
  await page.click('th[data-sort="3"]');
  const firstUnit = await page.locator('#glosTable tbody tr:first-child td:last-child').textContent();
  ok(firstUnit.trim() === '1', 'sort by unit puts unit 1 first');
  ok(await page.locator('#glosTable .say').count() === 275, 'speaker button on every glossary entry');

  // ---------- native-speaker audio (Lingua Libre) ----------
  console.log('native audio');
  ok((await page.locator('.audio-credits').textContent()).includes('CC BY-SA'), 'glossary shows CC BY-SA audio credits');
  await page.fill('#glosSearch', 'formatge');
  await page.locator('#glosTable tbody tr', { hasText: 'cheese' }).locator('.say').click();
  ok(await page.evaluate(() => window.__audioMode) === 'native', 'single word plays a native recording');
  await page.fill('#glosSearch', 'abril');
  await page.locator('#glosTable tbody tr', { hasText: 'maig' }).locator('.say').click();
  ok(await page.evaluate(() => window.__audioMode) === 'native', 'multi-word entry chains native recordings');
  await page.fill('#glosSearch', 'Quants anys tens');
  await page.locator('#glosTable tbody tr').first().locator('.say').click();
  ok(await page.evaluate(() => window.__audioMode) === 'tts', 'sentence falls back to TTS');
  await page.fill('#glosSearch', '');

  // ---------- gap-fill (EX 2.1) with accent tolerance ----------
  console.log('unit 2 — gap, match, reorder, model, free');
  await page.goto(BASE + 'unit/2');
  const gap = page.locator('.ex[data-ex="2.1"]');
  const inputs = gap.locator('.gap-input');
  const vals = ['soc', 'ets', 'es', 'som', 'són', 'sou'];   // item 3 missing accent → almost
  for (let i = 0; i < 6; i++) await inputs.nth(i).fill(vals[i]);
  await gap.locator('.btn-primary').click();
  ok(await gap.locator('.gap-input.ok').count() === 5, 'gap: 5 exact answers green');
  ok(await gap.locator('.gap-input.almost').count() === 1, 'gap: missing accent flagged as almost');
  ok((await gap.locator('.ex-score').textContent()).includes('6 / 6'), 'gap: score 6/6 (accent leniency counts)');
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('catalanA1.ex.2.1')).state);
  ok(state === 'passed', 'gap: state saved as passed');

  await gap.locator('.ex-controls .btn:not(.btn-primary)').click();   // Retry
  await inputs.nth(0).fill('xxx');
  await gap.locator('.btn-primary').click();
  ok(await gap.locator('.gap-input.bad').count() >= 1, 'gap: wrong answer red');

  // ---------- matching (EX 2.2): key 1-b, 2-d, 3-a, 4-c ----------
  const match = page.locator('.ex[data-ex="2.2"]');
  const pairs = [['0', 'b'], ['1', 'd'], ['2', 'a'], ['3', 'c']];
  for (const [l, r] of pairs) {
    await match.locator('.match-item[data-side="l"][data-key="' + l + '"]').click();
    await match.locator('.match-item[data-side="r"][data-key="' + r + '"]').click();
  }
  await match.locator('.btn-primary').click();
  ok(await match.locator('.match-item.ok').count() === 4, 'match: all four pairs green');
  ok((await match.locator('.ex-score').textContent()).includes('4 / 4'), 'match: score 4/4');

  // ---------- reorder (EX 2.4, first item: "Em dic Marc.") ----------
  const re = page.locator('.ex[data-ex="2.4"] .reorder[data-item="0"]');
  for (const tok of ['Em', 'dic', 'Marc', '.']) {
    await re.locator('.reorder-pool .chip', { hasText: new RegExp('^' + tok.replace('.', '\\.') + '$') }).click();
  }
  ok((await re.locator('.reorder-out').textContent()).trim() === 'Em dic Marc.', 'reorder: sentence built');
  await page.locator('.ex[data-ex="2.4"] .btn-primary').click();
  ok(await re.locator('.reorder-out.ok').count() === 1, 'reorder: correct order green');

  // ---------- model (EX 2.3 translate) ----------
  const model = page.locator('.ex[data-ex="2.3"]');
  await model.locator('.model-input').first().fill('Bon dia! Com estàs?');
  await model.locator('.ex-controls .btn:not(.btn-primary)').first().click();   // Show model answer
  ok(await model.locator('.model-answer').isVisible(), 'model: answer revealed');
  const yesBtns = model.locator('.sm-yes');
  for (let i = 0; i < await yesBtns.count(); i++) await yesBtns.nth(i).click();
  ok((await model.locator('.ex-score').textContent()).includes('4 / 4'), 'model: self-marked 4/4');

  // ---------- free writing (EX 2.8) ----------
  const free = page.locator('.ex[data-ex="2.8"]');
  await free.locator('.free-text').fill('Hola! Em dic QA. Soc de Testlàndia. Soc robot.');
  await free.locator('.ex-controls .btn:not(.btn-primary)').first().click();
  await free.locator('.sm-yes').click();
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('catalanA1.ex.2.8')).state);
  ok(state === 'passed', 'free: self-marked passed');

  // ---------- char strip ----------
  await inputs.nth(0).click();
  ok(await page.locator('.char-strip.visible').count() === 1, 'char strip appears on focus');
  await page.locator('.char-strip button', { hasText: 'ç' }).click();
  ok((await inputs.nth(0).inputValue()).includes('ç'), 'char strip inserts ç');

  // ---------- true/false (EX 1.4) + write (EX 1.2) ----------
  console.log('unit 1 — true/false, write');
  await page.goto(BASE + 'unit/1');
  const tf = page.locator('.ex[data-ex="1.4"]');
  await tf.locator('[data-item="0"] .tf-btn[data-val="true"]').click();   // correct
  await tf.locator('[data-item="1"] .tf-btn[data-val="true"]').click();   // wrong (key: false)
  ok(await tf.locator('[data-item="0"] .tf-btn.ok').count() === 1, 'tf: instant green on correct');
  ok(await tf.locator('[data-item="1"] .tf-btn.bad').count() === 1, 'tf: instant red on wrong');
  ok((await tf.locator('li').nth(1).locator('.item-fb').textContent()).includes("it's /b/"), 'tf: explanation shown');
  const wr = page.locator('.ex[data-ex="1.2"]');
  await wr.locator('li:nth-child(1) .gap-input').fill('llibre');
  await wr.locator('li:nth-child(2) .gap-input').fill('hola');
  await wr.locator('li:nth-child(3) .gap-input').fill('cafe');   // missing accent
  await wr.locator('li:nth-child(4) .gap-input').fill('maig');
  await wr.locator('.btn-primary').click();
  ok((await wr.locator('.ex-score').textContent()).includes('4 / 4'), 'write: 4/4 with accent flagged');
  ok(await wr.locator('.gap-input.almost').count() === 1, 'write: cafè without accent → almost');

  // ---------- choice (EX 8.4) ----------
  console.log('unit 8 — choice');
  await page.goto(BASE + 'unit/8');
  const ch = page.locator('.ex[data-ex="8.4"]');
  await ch.locator('[data-item="0"] .tf-btn[data-val="beguda"]').click();
  ok(await ch.locator('[data-item="0"] .tf-btn.ok').count() === 1, 'choice: aigua → beguda green');
  await ch.locator('[data-item="1"] .tf-btn[data-val="beguda"]').click();   // formatge is menjar
  ok(await ch.locator('[data-item="1"] .tf-btn.bad').count() === 1, 'choice: formatge → beguda red');

  // ---------- paradigm (EX 5.4) ----------
  console.log('unit 5 — paradigm');
  await page.goto(BASE + 'unit/5');
  const pa = page.locator('.ex[data-ex="5.4"]');
  const forms = ['compro', 'compres', 'compra', 'comprem', 'compreu', 'compren'];
  for (let i = 0; i < 6; i++) await pa.locator('.gap-input').nth(i).fill(forms[i]);
  await pa.locator('.btn-primary').click();
  ok((await pa.locator('.ex-score').textContent()).includes('6 / 6'), 'paradigm: 6/6');
  ok((await pa.locator('.paradigm-ipa').first().textContent()).includes('ˈkompɾu'), 'paradigm: IPA note shown');

  // ---------- personal (EX 12.5) ----------
  console.log('unit 12 — personal');
  await page.goto(BASE + 'unit/12');
  const pe = page.locator('.ex[data-ex="12.5"]');
  await pe.locator('.sm-yes').click();
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('catalanA1.ex.12.5')).state);
  ok(state === 'passed', 'personal: done button saves passed');

  // ---------- persistence across reload + dashboard ----------
  console.log('persistence');
  await page.goto(BASE);
  const stats = await page.locator('#overallStats').textContent();
  ok(/[1-9]\d* of 83 exercises passed/.test(stats), 'dashboard counts passed exercises (' + stats.trim() + ')');
  await page.locator('.check-item').first().check();
  await page.reload();
  ok(await page.locator('.check-item').first().isChecked(), 'checklist survives reload');
  await page.waitForTimeout(200);
  const navBadge = await page.locator('.nav-badge[data-unit="2"]').textContent();
  ok(/\d+\/8/.test(navBadge), 'unit 2 nav badge shows progress (' + navBadge + ')');

  // ---------- mock exam ----------
  console.log('mock exam');
  await page.goto(BASE + 'mock');
  ok(await page.locator('.script-text').isHidden(), 'listening script hidden initially');
  const key = [false, true, false, true, false, false];
  for (let i = 0; i < 6; i++) {
    await page.locator('#paper1 [data-item="' + i + '"] .tf-btn[data-val="' + key[i] + '"]').click();
  }
  ok((await page.locator('#p1controls .ex-score').textContent()).includes('6 / 6'), 'paper 1 auto-marked 6/6');
  ok(await page.locator('#scriptReveal').isVisible(), 'script reveal unlocked after answering');
  await page.click('#showScript');
  ok(await page.locator('.script-text').isVisible(), 'script shown on demand');
  const p2bPairs = [['0', 'b'], ['1', 'd'], ['2', 'a'], ['3', 'e'], ['4', 'c']];
  for (const [l, r] of p2bPairs) {
    await page.locator('#p2b .match-item[data-side="l"][data-key="' + l + '"]').click();
    await page.locator('#p2b .match-item[data-side="r"][data-key="' + r + '"]').click();
  }
  await page.locator('#p2b .btn-primary').click();
  ok((await page.locator('#p2b .ex-score').textContent()).includes('5 / 5'), 'paper 2B 5/5');
  await page.check('#examConditions');
  ok(await page.locator('.paper-timer').first().isVisible(), 'exam conditions shows timers');
  await page.locator('.paper-timer[data-paper="1"] .timer-start').click();
  await page.waitForTimeout(1500);
  ok(/14:5\d/.test(await page.locator('.paper-timer[data-paper="1"] .timer-display').textContent()), 'paper 1 timer counts down from 15:00');
  page.once('dialog', d => d.accept());
  await page.click('#saveAttempt');
  await page.reload();
  ok((await page.locator('#attemptHistory').textContent()).includes('6/6'), 'attempt history shows P1 6/6 after reload');

  // ---------- 380px viewport ----------
  console.log('mobile 380px');
  const mob = await browser.newPage({ viewport: { width: 380, height: 740 } });
  mob.on('pageerror', e => { console.log('  ✗ MOBILE PAGE ERROR: ' + e.message); failures++; });
  await mob.goto(BASE + 'unit/3');
  ok(await mob.locator('.topbar').isVisible(), 'mobile: topbar visible');
  ok(await mob.locator('#sidebar').evaluate(el => el.getBoundingClientRect().right <= 0), 'mobile: sidebar off-canvas');
  await mob.click('#navToggle');
  await mob.waitForTimeout(350);
  ok(await mob.locator('#sidebar').evaluate(el => el.getBoundingClientRect().left === 0), 'mobile: hamburger opens sidebar');
  await mob.locator('#backdrop').click({ position: { x: 370, y: 500 } });
  await mob.waitForTimeout(350);
  const hscroll = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(hscroll <= 1, 'mobile: no horizontal scroll on unit page (overflow ' + hscroll + 'px)');
  const gap31 = mob.locator('.ex[data-ex="3.1"] .gap-input').first();
  await gap31.scrollIntoViewIfNeeded();
  await gap31.fill('tinc');
  await mob.locator('.ex[data-ex="3.1"] .btn-primary').click();
  ok(await mob.locator('.ex[data-ex="3.1"] .gap-input.ok').count() === 1, 'mobile: exercise interaction works');

  // ---------- IPA quick-reference drawer ----------
  console.log('IPA drawer');
  await page.goto(BASE + 'unit/5');
  ok(await page.locator('#ipaTab').isVisible(), 'IPA tab visible on a unit page');
  let offscreen = await page.locator('#ipaDrawer').evaluate(el => el.getBoundingClientRect().left >= window.innerWidth - 2);
  ok(offscreen, 'drawer starts off-screen');
  await page.click('#ipaTab');
  await page.waitForTimeout(300);
  const drawerText = await page.locator('#ipaDrawer').textContent();
  ok(/Vowels/.test(drawerText) && /golden rule/i.test(drawerText) && /Consonants/.test(drawerText),
    'drawer holds the condensed IPA tables + golden rule');
  ok(await page.locator('#ipaDrawer .say').count() > 10, 'drawer examples have speaker buttons');
  await page.locator('#ipaBackdrop').click({ position: { x: 20, y: 300 } });
  await page.waitForTimeout(300);
  offscreen = await page.locator('#ipaDrawer').evaluate(el => el.getBoundingClientRect().left >= window.innerWidth - 2);
  ok(offscreen, 'backdrop click closes the drawer');
  await page.click('#ipaTab');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  offscreen = await page.locator('#ipaDrawer').evaluate(el => el.getBoundingClientRect().left >= window.innerWidth - 2);
  ok(offscreen, 'Escape closes the drawer');
  ok(await page.locator('#ipaTab').isVisible(), 'tab still visible after closing');
  // glossary page too — available on every page
  await page.goto(BASE + 'glossary');
  ok(await page.locator('#ipaTab').isVisible(), 'IPA tab visible on the glossary page');

  // mobile drawer at 380px
  await mob.goto(BASE + 'unit/2');
  ok(await mob.locator('#ipaTab').isVisible(), 'mobile: IPA tab visible');
  await mob.click('#ipaTab');
  await mob.waitForTimeout(300);
  const fits = await mob.locator('#ipaDrawer').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= window.innerWidth + 1;
  });
  ok(fits, 'mobile: drawer fits the 380px viewport');
  ok((await mob.locator('#ipaDrawer').textContent()).includes('Vowels'), 'mobile: drawer content rendered');
  await mob.click('#ipaDrawer .ipa-close');
  await mob.waitForTimeout(300);
  const mobClosed = await mob.locator('#ipaDrawer').evaluate(el => el.getBoundingClientRect().left >= window.innerWidth - 2);
  ok(mobClosed, 'mobile: × closes the drawer');
  const hscroll2 = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(hscroll2 <= 1, 'mobile: no horizontal scroll with drawer mounted (overflow ' + hscroll2 + 'px)');

  // ---------- resource links open in new tabs ----------
  await page.goto(BASE + 'unit/2');
  const extLinks = await page.locator('.res a[href^="http"]').count();
  const blankLinks = await page.locator('.res a[target="_blank"]').count();
  ok(extLinks > 0 && extLinks === blankLinks, 'all .res external links target=_blank (' + extLinks + ')');

  // ---------- reset ----------
  console.log('reset');
  await page.goto(BASE);
  page.once('dialog', d => d.accept());
  await page.click('#resetProgress');
  await page.waitForTimeout(300);
  const cleared = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('catalanA1.')).length);
  ok(cleared === 0, 'reset clears all catalanA1.* keys');

  await browser.close();
  console.log(failures === 0 ? '\nALL TESTS PASSED' : '\n' + failures + ' FAILURES');
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
