'use strict';
// Controlled fixtures, actual Chromium DOM. This is not an external leaderboard.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const os = require('node:os'), path = require('node:path');
const { radio, pageFor, preview } = require('../tests/helpers.cjs');
const root = path.resolve(__dirname, '..');
const baseline = readFileSync(path.join(root, 'tests/fixtures/baseline-v1.5.js'), 'utf8');
const sha = source => createHash('sha256').update(source).digest('hex');
const nttu = (name, count = 5) => `<fieldset><legend>NTTU ${name}</legend><ul class="group-cautraloi">${Array.from({ length: count }, (_, i) => `<li><label><input type="radio" name="${name}" value="${i + 1}">${i === count - 1 ? 'Hoàn toàn đồng ý' : `Mức ${i + 1}`}</label></li>`).join('')}</ul></fieldset>`;
const aria = (name, count) => `<div role="listitem"><h2 role="heading">${name}</h2><div role="radiogroup">${Array.from({ length: count }, (_, i) => `<div role="radio" aria-checked="false" tabindex="0">${i + 1}</div>`).join('')}</div></div>`;
const cases = [
  ...[3, 5, 7].map(count => ({ name: `nttu-${count}`, html: nttu(`nttu${count}`, count), expected: String(count), selector: 'input:checked' })),
  ...[2, 3, 5, 7, 10].map(count => ({ name: `html-radio-${count}`, html: radio(count), expected: String(count), selector: 'input:checked' })),
  { name: 'google-aria-7', html: aria('Google', 7), expected: '7', selector: '[aria-checked=true]' },
  { name: 'microsoft-aria-2', html: aria('Microsoft', 2), expected: '2', selector: '[aria-checked=true]' },
  { name: 'checkbox', html: '<fieldset><legend>Nhiều đáp án</legend><label><input type="checkbox" name="x" value="1">Một</label><label><input type="checkbox" name="x" value="2">Hai</label></fieldset>', selector: 'input:checked', expected: '2' },
  { name: 'select', html: '<label>Đáp án<select><option value="">Chọn</option><option value="1">Một</option><option value="2">Hai</option></select></label>', selector: 'select', expected: '2' },
  { name: 'bounded-number', html: '<input aria-label="Điểm" type="number" min="0" max="10">', selector: 'input', expected: '10', settings: { numericEnabled: true } },
  { name: 'explicit-comment', html: '<label>Góp ý<textarea></textarea></label>', selector: 'textarea', expected: 'ok', settings: { textMode: 'fixed', textTemplates: 'ok' } }
];
async function actual(page, item) {
  return page.locator(item.selector).evaluateAll(nodes => nodes.map(node => ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName) ? node.value : node.textContent.trim()).join('|'));
}
async function loadBaseline(page, html) {
  await page.setContent(html);
  await page.evaluate(() => {
    window.done = false; window.alert = () => { window.done = true; }; window.confirm = () => false;
    window.chrome = { runtime: { onMessage: { addListener(fn) { window.baselineListener = fn; } } } };
    document.querySelectorAll('[role=radio]').forEach(node => node.addEventListener('click', () => node.parentElement.querySelectorAll('[role=radio]').forEach(option => option.setAttribute('aria-checked', String(option === node)))));
  });
  await page.addScriptTag({ content: baseline });
}
const summarize = values => {
  const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
  return { medianMs: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], samples: values };
};
assert.deepEqual(summarize([1, 2, 3, 4]).medianMs, 2.5);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const report = { schemaVersion: 1, date: new Date().toISOString(), browser: browser.version(), node: process.version,
      os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model,
      baselineCommit: '8ed9f0411858a3e907c0508d17bb5173ef212158', baselineSha256: sha(baseline),
      engineSha256: sha(readFileSync(path.join(root, 'content.js'))), policySha256: sha(readFileSync(path.join(root, 'shared.js'))),
      scope: 'Synthetic fixtures with expected DOM values. No live NTTU/Google/MS pages, network, CAPTCHA, closed shadow roots or cross-origin frames.',
      timingScope: 'Page-side elapsed time to actual completion. New version includes scan/preview + fill; old version includes its intentional human-like delays. Excludes browser startup and script injection; not a CPU optimization measurement.',
      correctness: [], timing: null };
    for (const item of cases) {
      const oldPage = await browser.newPage(); await loadBaseline(oldPage, item.html);
      await oldPage.evaluate(() => window.baselineListener({ action: 'fill_survey', data: {}, mucDo: 'Hoàn toàn đồng ý' }, {}, () => {}));
      await oldPage.waitForFunction(() => window.done, null, { timeout: 10000 });
      const oldValue = await actual(oldPage, item); await oldPage.close();
      const page = await pageFor(browser, item.html);
      await page.evaluate(() => document.querySelectorAll('[role=radio]').forEach(node => node.addEventListener('click', () => node.parentElement.querySelectorAll('[role=radio]').forEach(option => option.setAttribute('aria-checked', String(option === node))))));
      const settings = item.settings || {}, view = await preview(page, { settings });
      const result = await page.evaluate(({ view, settings }) => window.__surveyEngine.run({ settings, fingerprint: view.fingerprint, seed: view.seed, jobId: 'bench' }), { view, settings });
      const newValue = await actual(page, item); await page.close();
      assert.equal(newValue, item.expected, item.name); assert.equal(result.failed, 0, item.name);
      report.correctness.push({ case: item.name, expected: item.expected, baselineValue: oldValue, baselinePass: oldValue === item.expected, currentValue: newValue, currentPass: newValue === item.expected });
    }
    const html = Array.from({ length: 10 }, (_, i) => nttu(`speed${i}`)).join('');
    const samples = { baseline: [], current: [] }, iterations = 5;
    for (let iteration = -1; iteration < iterations; iteration++) {
      // Alternate order. One warmup each, then five measured runs on fresh pages.
      for (const name of iteration % 2 === 0 ? ['baseline', 'current'] : ['current', 'baseline']) {
        const page = name === 'baseline' ? await browser.newPage() : await pageFor(browser, html);
        if (name === 'baseline') await loadBaseline(page, html);
        const ms = name === 'baseline' ? await page.evaluate(async () => { const start = performance.now(); window.baselineListener({ action: 'fill_survey', data: {}, mucDo: 'Hoàn toàn đồng ý' }, {}, () => {}); while (!window.done) await new Promise(resolve => setTimeout(resolve, 5)); return performance.now() - start; }) : await page.evaluate(async () => { const start = performance.now(); const view = window.__surveyEngine.scan({ settings: {}, data: {}, overrides: {} }); await window.__surveyEngine.run({ settings: {}, fingerprint: view.fingerprint, seed: view.seed, jobId: 'speed' }); return performance.now() - start; });
        assert.equal(await page.locator('input:checked').count(), 10);
        assert.deepEqual(await page.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value)), Array(10).fill('5'));
        if (iteration >= 0) samples[name].push(ms); await page.close();
      }
    }
    report.timing = { questions: 10, iterations, warmups: 1, baseline: summarize(samples.baseline), current: summarize(samples.current) };
    report.timing.medianSpeedup = report.timing.baseline.medianMs / report.timing.current.medianMs;
    report.correctnessTotals = { total: cases.length, baselinePassed: report.correctness.filter(row => row.baselinePass).length, currentPassed: report.correctness.filter(row => row.currentPass).length };
    mkdirSync(path.join(root, 'docs'), { recursive: true }); writeFileSync(path.join(root, 'docs/benchmark-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ correctness: report.correctnessTotals, timing: report.timing }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
