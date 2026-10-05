'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, radio, pageFor, preview, fill, engine } = require('./helpers.cjs');
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });
test('NTTU, arbitrary scales, matrix rows and separate forms', async () => {
  const page = await pageFor(browser, `<form>${[2, 3, 5, 7, 10].map(n => radio(n, `scale${n}`)).join('')}</form><form>${radio(3, 'scale3')}</form><table><tr><th>Ma trận</th><td>${radio(2, 'matrix')}</td></tr></table>`);
  try {
    const { view, result } = await fill(page); assert.equal(view.questions.length, 7); assert.equal(result.filled, 7); assert.equal(result.failed, 0);
    assert.deepEqual(await page.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value)), ['2', '3', '5', '7', '10', '3', '2']);
  } finally { await page.close(); }
});
test('custom Google/MS ARIA groups select real state, with no native duplication', async () => {
  const html = `<div role="listitem"><h3 role="heading">Google question</h3><div role="radiogroup">${[1, 2, 3].map(n => `<div role="radio" aria-checked="false" tabindex="0">${n}</div>`).join('')}</div></div><div data-automation-id="questionItem"><div data-automation-id="questionTitle">Microsoft question</div><div role="radiogroup">${[1, 2].map(n => `<div role="radio" aria-checked="false" tabindex="0">${n}</div>`).join('')}</div></div><div role="radiogroup"><div role="radio">${radio(5, 'native')}</div></div>`;
  const page = await pageFor(browser, html);
  await page.evaluate(() => document.querySelectorAll('[role="radio"]').forEach(node => node.addEventListener('click', () => { if (node.querySelector('input')) return; node.parentElement.querySelectorAll('[role="radio"]').forEach(option => option.setAttribute('aria-checked', String(option === node))); })));
  try { const { result, view } = await fill(page); assert.equal(view.questions.length, 3); assert.equal(result.filled, 3); assert.equal(result.failed, 0); }
  finally { await page.close(); }
});
test('checkboxes and multiple selects respect exact override counts', async () => {
  const page = await pageFor(browser, `<fieldset><legend>Chọn nhiều</legend>${[1, 2, 3].map(n => `<label><input type="checkbox" name="multi" value="${n}">${n}</label>`).join('')}</fieldset><label>Danh sách<select multiple><option value="1">Một</option><option value="2">Hai</option><option value="3">Ba</option></select></label>`);
  try {
    const { result } = await fill(page, { settings: { mode: 'random', checkboxMin: 2, checkboxMax: 2 } });
    assert.equal(result.filled, 2); assert.equal(await page.locator('input:checked').count(), 2); assert.equal(await page.locator('option:checked').count(), 2);
  } finally { await page.close(); }
});
test('labels and profile matching do not confuse course name with course code', async () => {
  const page = await pageFor(browser, '<label>Tên môn học<input id="course"></label><label>Mã môn học<input id="code"></label><label>HỌ VÀ TÊN *<input id="person"></label><label>Email<input type="email"></label><label>Khoa<select><option value="">Chọn</option><option value="it">CNTT</option></select></label><textarea aria-label="Nhận xét"></textarea>');
  try {
    const { result } = await fill(page, { data: { tenMonHoc: 'Toán', maMonHoc: 'M101', hoTen: 'Nguyễn An', email: 'an@example.org', khoa: 'CNTT' } });
    assert.equal(result.filled, 5); assert.equal(await page.locator('#course').inputValue(), 'Toán'); assert.equal(await page.locator('#code').inputValue(), 'M101'); assert.equal(await page.locator('textarea').inputValue(), '');
    assert.equal(await page.locator('#person').inputValue(), 'Nguyễn An');
  } finally { await page.close(); }
});
test('preserves answers, hidden and disabled fields and never submits', async () => {
  const page = await pageFor(browser, `<form>${radio(3)}<label>Họ tên<input value="Người dùng"></label><fieldset hidden>${radio(5, 'hidden')}</fieldset><fieldset disabled>${radio(5, 'disabled')}</fieldset><textarea readonly>Giữ lại</textarea><button type="submit" id="btnGui">Gửi</button></form>`);
  await page.evaluate(() => { document.querySelector('input[type="radio"]').checked = true; window.submits = 0; document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); window.submits++; }); });
  try {
    const { result, view } = await fill(page, { data: { hoTen: 'Thay đổi' } }); assert.equal(view.questions.length, 2); assert.equal(result.skipped, 2);
    assert.equal(await page.evaluate(() => window.submits), 0); assert.equal(await page.locator('input:not([type])').inputValue(), 'Người dùng');
  } finally { await page.close(); }
});
test('stale preview is rejected without edits; injection keeps one listener', async () => {
  const page = await pageFor(browser, radio(3));
  try {
    await page.addScriptTag({ content: engine }); assert.equal(await page.evaluate(() => window.listenerCount), 1);
    const view = await preview(page); await page.evaluate(() => { document.querySelector('label').lastChild.textContent = 'Changed'; });
    await assert.rejects(() => page.evaluate(view => window.__surveyEngine.run({ settings: {}, fingerprint: view.fingerprint, seed: view.seed }), view), /Biểu mẫu đã thay đổi/);
    assert.equal(await page.locator('input:checked').count(), 0);
  } finally { await page.close(); }
});
test('random preview matches applied answers and preserves user edits after preview', async () => {
  const page = await pageFor(browser, [1, 2, 3, 4, 5].map(n => radio(7, `r${n}`)).join(''));
  try {
    const settings = { mode: 'random', seed: 'repeatable' }, view = await preview(page, { settings });
    await page.evaluate(() => { document.querySelector('input').checked = true; });
    const result = await page.evaluate(({ view, settings }) => window.__surveyEngine.run({ settings, fingerprint: view.fingerprint, seed: view.seed }), { view, settings });
    assert.equal(result.filled, 4); assert.equal(result.skipped, 1);
    const actual = await page.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value));
    assert.deepEqual(actual, ['1', ...view.plan.slice(1).map(row => row.answer)]);
  } finally { await page.close(); }
});
test('stop cancels large jobs and duplicate starts do not disrupt the active job', async () => {
  const page = await pageFor(browser, Array.from({ length: 50 }, (_, n) => radio(3, `bulk${n}`)).join(''));
  try {
    const view = await preview(page, { settings: { delayMs: 20 } });
    await page.evaluate(view => { window.pending = window.__surveyEngine.run({ settings: { delayMs: 20 }, fingerprint: view.fingerprint, seed: view.seed, jobId: 'original' }); }, view);
    await page.waitForFunction(() => window.__surveyEngine.status().done >= 2);
    await assert.rejects(() => page.evaluate(view => window.__surveyEngine.run({ settings: {}, fingerprint: view.fingerprint, jobId: 'duplicate' }), view), /đang chạy/);
    await page.evaluate(() => window.__surveyEngine.cancel());
    const result = await page.evaluate(() => window.pending); assert.equal(result.state, 'cancelled'); assert.ok(result.filled >= 2 && result.filled < 50);
  } finally { await page.close(); }
});
test('conditional questions are reported for rescan, not silently missed', async () => {
  const page = await pageFor(browser, radio(2));
  await page.evaluate(() => document.querySelector('fieldset').addEventListener('change', () => { document.body.insertAdjacentHTML('beforeend', '<label>Góp ý mới<textarea required></textarea></label>'); }, { once: true }));
  try { const { result } = await fill(page); assert.equal(result.filled, 1); assert.equal(result.report.requiredRemaining.length, 1); assert.ok(result.report.warnings.some(text => text.includes('thay đổi'))); }
  finally { await page.close(); }
});
test('input setter notifies controlled framework state and rejects invalid values', async () => {
  const page = await pageFor(browser, '<label>Họ tên<input id="controlled"></label><label>Email<input id="mail" type="email"></label><input type="password" value="secret"><input type="file">');
  await page.evaluate(() => { window.state = ''; const input = document.querySelector('#controlled'); Object.defineProperty(input, 'value', { get() { return this.getAttribute('data-tracked') || ''; }, set(value) { this.setAttribute('data-tracked', value); } }); input.addEventListener('input', () => { window.state = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get.call(input); input.setAttribute('data-tracked', window.state); }); });
  try {
    const { result } = await fill(page, { data: { hoTen: '<script>literal</script>', email: 'invalid' } });
    assert.equal(result.filled, 1); assert.equal(result.failed, 1); assert.equal(await page.evaluate(() => window.state), '<script>literal</script>'); assert.equal(await page.locator('#mail').inputValue(), '');
  } finally { await page.close(); }
});
test('bounded numbers, ranges, contenteditable and explicit date overrides', async () => {
  const page = await pageFor(browser, '<input aria-label="Điểm" type="number" min="0" max="10" step="0.5"><input aria-label="Thanh điểm" type="range" min="1" max="7"><input aria-label="Ngày" type="date"><div contenteditable="true" role="textbox" aria-label="Góp ý"></div>');
  try {
    const view = await preview(page); const date = view.questions.find(question => question.inputType === 'date');
    const { result } = await fill(page, { settings: { numericEnabled: true, fixedScore: 75, textMode: 'fixed', textTemplates: 'Nội dung của tôi' }, overrides: { [date.id]: { mode: 'value', value: '2026-10-05' } } });
    assert.equal(result.filled, 4); assert.equal(result.failed, 0); assert.equal(await page.locator('input[type=number]').inputValue(), '7.5'); assert.equal(await page.locator('input[type=date]').inputValue(), '2026-10-05');
  } finally { await page.close(); }
});
test('same-origin iframe and open shadow DOM are included once', async () => {
  const page = await pageFor(browser, '<div id="shadow"></div><iframe srcdoc="<label>Họ tên<input></label>"></iframe>');
  await page.evaluate(() => { document.querySelector('#shadow').attachShadow({ mode: 'open' }).innerHTML = '<label>Email<input type="email"></label>'; });
  try { const { result, view } = await fill(page, { data: { hoTen: 'An', email: 'an@example.org' } }); assert.equal(view.questions.length, 2); assert.equal(result.filled, 2); assert.equal(result.failed, 0); }
  finally { await page.close(); }
});
test('unresponsive ARIA widgets produce a failure instead of fake success', async () => {
  const page = await pageFor(browser, '<div role="radiogroup"><div role="radio" aria-checked="false">A</div><div role="radio" aria-checked="false">B</div></div>');
  try { const { result } = await fill(page); assert.equal(result.filled, 0); assert.equal(result.failed, 1); assert.match(result.report.rows[0].reason, /chưa nhận/); }
  finally { await page.close(); }
});
test('comment templates never invent missing personal or course information', async () => {
  const page = await pageFor(browser, '<label>Họ tên<input></label><label>Mã môn học<input></label><label>Khoa<select><option value="">Chọn</option><option value="it">CNTT</option></select></label><label>Nhận xét<textarea></textarea></label>');
  try {
    const { result } = await fill(page, { settings: { textMode: 'fixed', textTemplates: 'Nhận xét' } });
    assert.equal(result.filled, 1); assert.equal(result.skipped, 3); assert.equal(await page.locator('textarea').inputValue(), 'Nhận xét');
    assert.deepEqual(await page.locator('input').evaluateAll(nodes => nodes.map(node => node.value)), ['', '']);
  } finally { await page.close(); }
});
test('closed dropdown with empty value is detected, and ignored clicks never count as success', async () => {
  const page = await pageFor(browser, '<div role="listbox" data-value="" aria-label="Lựa chọn"><div role="option" aria-selected="false" data-value="1">Một</div><div role="option" aria-selected="false" data-value="2">Hai</div></div>');
  try { const { result, view } = await fill(page); assert.equal(view.questions[0].answered, false); assert.equal(result.filled, 0); assert.equal(result.failed, 1); }
  finally { await page.close(); }
});
test('message listener keeps response pending until completion and rejects overlapping jobs safely', async () => {
  const page = await pageFor(browser, Array.from({ length: 6 }, (_, i) => radio(3, `message${i}`)).join(''));
  try {
    const view = await preview(page, { settings: { delayMs: 25 } });
    await page.evaluate(view => { window.response = null; window.returned = window.listener({ action: 'survey_run', settings: { delayMs: 25 }, fingerprint: view.fingerprint, seed: view.seed, jobId: 'channel-original' }, {}, value => { window.response = value; }); }, view);
    assert.equal(await page.evaluate(() => window.returned), true);
    await page.waitForFunction(() => window.__surveyEngine.status().done >= 1);
    assert.equal(await page.evaluate(() => window.response), null);
    const duplicate = await page.evaluate(view => new Promise(resolve => window.listener({ action: 'survey_run', settings: {}, fingerprint: view.fingerprint, seed: view.seed, jobId: 'channel-duplicate' }, {}, resolve)), view);
    assert.equal(duplicate.ok, false); assert.equal(await page.evaluate(() => window.__surveyEngine.status().state), 'running');
    await page.waitForFunction(() => window.response?.state === 'completed');
    assert.equal(await page.evaluate(() => window.response.filled), 6);
  } finally { await page.close(); }
});
test('1,000-question survey completes with exact counts and no duplicate choices', { timeout: 45000 }, async () => {
  const page = await pageFor(browser, Array.from({ length: 1000 }, (_, i) => radio(3, `stress${i}`)).join(''));
  try { const { result, view } = await fill(page); assert.equal(view.questions.length, 1000); assert.equal(result.filled, 1000); assert.equal(result.failed, 0); assert.equal(await page.locator('input:checked').count(), 1000); }
  finally { await page.close(); }
});
test('required checkboxes are validated individually and prefilled ranges are preserved', async () => {
  const page = await pageFor(browser, '<fieldset><legend>Hai lựa chọn bắt buộc</legend><label><input type="checkbox" name="req" required value="a">A</label><label><input type="checkbox" name="req" required value="b">B</label></fieldset><input type="range" min="0" max="10" value="2" aria-label="Điểm sẵn có">');
  try { const { result } = await fill(page, { settings: { numericEnabled: true } }); assert.equal(result.filled, 1); assert.equal(result.skipped, 1); assert.equal(result.report.requiredRemaining.length, 1); assert.equal(await page.locator('input[type=range]').inputValue(), '2'); }
  finally { await page.close(); }
});
