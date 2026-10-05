'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { mkdtempSync, readFileSync, rmSync, mkdirSync } = require('node:fs');
const os = require('node:os'), path = require('node:path'), http = require('node:http');
let context, worker, server, profileDir, baseUrl, extensionId;
const project = path.resolve(__dirname, '..');
before(async () => {
  server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(readFileSync(path.join(__dirname, 'fixtures/survey.html'))); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}`;
  profileDir = mkdtempSync(path.join(os.tmpdir(), 'autofill-extension-'));
  context = await chromium.launchPersistentContext(profileDir, { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${project}`, `--load-extension=${project}`] });
  worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker'); extensionId = new URL(worker.url()).hostname;
});
after(async () => { await context?.close(); if (server) await new Promise(resolve => server.close(resolve)); if (profileDir) { assert.ok(path.resolve(profileDir).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(profileDir).startsWith('autofill-extension-')); rmSync(profileDir, { recursive: true, force: true }); } });
test('installed MV3: messaging awaits completion, progress, repeat injection, storage, side panel config', async () => {
  const page = await context.newPage(); await page.goto(baseUrl);
  try {
    const info = await worker.evaluate(async url => {
      const [tab] = await chrome.tabs.query({ url: `${url}/*` });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['shared.js', 'content.js'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['shared.js', 'content.js'] });
      const request = { settings: { textMode: 'fixed', textTemplates: 'Nhận xét của tôi', numericEnabled: true }, data: { hoTen: 'Nguyễn An', tenMonHoc: 'Toán', maMonHoc: 'M101', email: 'an@example.org', khoa: 'CNTT', hocKy: '2' } };
      const preview = await chrome.tabs.sendMessage(tab.id, { action: 'survey_scan', ...request });
      const messages = []; const listener = (message, sender) => { if (message.action === 'survey_progress' && sender.tab?.id === tab.id) messages.push(message.progress); };
      chrome.runtime.onMessage.addListener(listener);
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'survey_run', ...request, fingerprint: preview.fingerprint, seed: preview.seed, jobId: 'actual-extension' });
      chrome.runtime.onMessage.removeListener(listener);
      await chrome.storage.local.set({ preferences: request.settings });
      return { result, preview, messages, stored: await chrome.storage.local.get('preferences'), panel: await chrome.sidePanel.getOptions({}) };
    }, baseUrl);
    assert.equal(info.result.state, 'completed'); assert.equal(info.result.failed, 0); assert.equal(info.result.done, info.preview.questions.length); assert.equal(info.result.filled, 13);
    assert.ok(info.messages.some(message => message.state === 'running')); assert.equal(info.panel.path, 'popup.html'); assert.equal(info.stored.preferences.numericEnabled, true);
    assert.equal(await page.evaluate(() => window.submitCount), 0); assert.equal(await page.locator('#person').inputValue(), 'Nguyễn An');
    assert.equal(await page.locator('#customList').getAttribute('data-value'), '2');
  } finally { await page.close(); }
});
test('installed panel: three tabs, saved profiles, preview, run, recovery and narrow layout', async () => {
  const fixture = await context.newPage(); await fixture.goto(`${baseUrl}/panel`);
  const panel = await context.newPage(); const errors = []; panel.on('pageerror', error => errors.push(error.message));
  try {
    await panel.goto(`chrome-extension://${extensionId}/popup.html`);
    await panel.waitForFunction(() => document.querySelector('#profileFields input'));
    await panel.locator('#tab-google').click(); assert.equal(await panel.locator('#tab-google').getAttribute('aria-selected'), 'true');
    await panel.locator('#tab-microsoft').click(); assert.match(await panel.locator('#platformText').textContent(), /Microsoft/);
    await panel.locator('#profileDetails').evaluate(node => { node.open = true; });
    await panel.locator('#hoTen').fill('Nguyễn An'); await panel.locator('#newProfileName').fill('Hồ sơ thử nghiệm');
    await panel.locator('#saveProfile').click(); await panel.waitForFunction(() => document.querySelector('#status').textContent.includes('Đã lưu hồ sơ'));
    await panel.locator('#hoTen').fill(''); await panel.locator('#loadProfile').click(); assert.equal(await panel.locator('#hoTen').inputValue(), 'Nguyễn An');
    // Query the actual Chrome active tab; programmatic DOM clicks keep the fixture active.
    await fixture.bringToFront();
    await panel.locator('#scanBtn').evaluate(node => node.click());
    await panel.waitForFunction(() => !document.querySelector('#fillBtn').disabled, { timeout: 10000 });
    assert.match(await panel.locator('#questionCount').textContent(), /13 câu/);
    await panel.locator('#fillBtn').evaluate(node => node.click());
    await panel.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Đã xử lý'), { timeout: 10000 });
    assert.equal(await fixture.locator('#person').inputValue(), 'Nguyễn An'); assert.equal(await fixture.evaluate(() => window.submitCount), 0);
    await panel.reload(); await panel.waitForFunction(() => !document.querySelector('#resultCard').hidden);
    assert.match(await panel.locator('#resultSummary').textContent(), /Đã điền/);
    await panel.setViewportSize({ width: 300, height: 900 });
    assert.equal(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    mkdirSync(path.join(project, 'test-results'), { recursive: true }); await panel.screenshot({ path: path.join(project, 'test-results/panel-300px.png'), fullPage: true });
    assert.deepEqual(errors, []);
  } finally { await panel.close(); await fixture.close(); }
});
