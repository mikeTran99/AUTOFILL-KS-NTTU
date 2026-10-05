// Reproduce known ceilings for the upgrade plan, rather than call them passing compatibility tests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium, radio, pageFor, preview, fill } = require('../tests/helpers.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const observations = [];
  async function probe(id, html, observe) {
    const page = await pageFor(browser, html);
    try { observations.push({ id, ...(await observe(page)) }); }
    finally { await page.close(); }
  }
  try {
    const options = labels => `<fieldset><legend>Mức hài lòng</legend>${labels.map((label, index) => `<label><input type="radio" name="rating" value="${index}">${label}</label>`).join('')}</fieldset>`;
    await probe('semantic-na', options(['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng', 'Không áp dụng']), async page => {
      const result = await preview(page, { settings: { fixedScore: 100 } });
      const actual = result.plan[0].answer;
      assert.equal(actual, 'Không áp dụng');
      return { requested: 'Highest satisfaction, excluding N/A', expected: 'Rất hài lòng', actual, gapObserved: true };
    });
    await probe('reversed-numeric-scale', options(['7', '6', '5', '4', '3', '2', '1']), async page => {
      const result = await preview(page, { settings: { fixedScore: 100 } });
      assert.equal(result.plan[0].answer, '1');
      return { requested: 'Highest numeric score on a reversed 7..1 scale', expected: '7', actual: result.plan[0].answer, gapObserved: true };
    });
    await probe('closed-combobox', '<label id="title">Danh sách</label><div role="combobox" aria-labelledby="title" aria-expanded="false" tabindex="0"></div>', async page => {
      const result = await preview(page);
      assert.equal(result.questions.length, 0);
      return { expectedQuestions: 1, actualQuestions: result.questions.length, gapObserved: true };
    });
    const html = Array.from({ length: 16 }, (_, i) => radio(7, `stable${i}`)).join('');
    await probe('seed-rerender', html, async page => {
      const settings = { mode: 'random', seed: 'audit-stable-identity' };
      const first = await preview(page, { settings });
      await page.evaluate(html => { document.body.innerHTML = html; }, html);
      const second = await preview(page, { settings });
      const changedIds = first.questions.filter((q, i) => q.id !== second.questions[i].id).length;
      const changedAnswers = first.plan.filter((q, i) => q.answer !== second.plan[i].answer).length;
      assert.equal(changedIds, 16); assert.ok(changedAnswers > 0);
      return { sameHtml: true, sameSeed: true, changedIds, changedAnswers, gapObserved: true };
    });
    await probe('fractional-step-any', '<input aria-label="Điểm" type="number" min="0" max="1" step="any">', async page => {
      const { result } = await fill(page, { settings: { numericEnabled: true, fixedScore: 50 } });
      const actual = await page.locator('input').inputValue();
      assert.equal(actual, '1');
      return { requested: 'Midpoint of 0..1 with arbitrary decimal step', expected: '0.5', actual, filled: result.filled, gapObserved: true };
    });
    const sourceSha256 = Object.fromEntries(['shared.js', 'content.js'].map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(__dirname, '..', file))).digest('hex')]));
    const output = { measuredAt: new Date().toISOString(), runtimeBaseline: '1a8c9c0c2cded8a23e8567ff9a28aeaf517ea3c2', sourceSha256, browser: browser.version(), kind: 'Targeted gap reproductions; not representative success-rate or competitor scores', observations };
    const file = path.join(__dirname, '../docs/research/2026-10-05/v2-gap-audit.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(output, null, 2) + '\n');
    console.log(JSON.stringify(output, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
