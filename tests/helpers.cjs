'use strict';
const path = require('node:path');
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const shared = readFileSync(path.join(__dirname, '../shared.js'), 'utf8');
const engine = readFileSync(path.join(__dirname, '../content.js'), 'utf8');
function radio(count, name = 'q', extra = '') {
  return `<fieldset><legend>Đánh giá ${name}</legend>${Array.from({ length: count }, (_, i) => `<label><input type="radio" name="${name}" value="${i + 1}" ${extra}>${i + 1}</label>`).join('')}</fieldset>`;
}
async function pageFor(browser, html) {
  const page = await browser.newPage();
  await page.setContent(html);
  await page.evaluate(() => { window.chrome = { runtime: { onMessage: { addListener(fn) { window.listener = fn; window.listenerCount = (window.listenerCount || 0) + 1; } }, sendMessage: async () => ({}) } }; });
  await page.addScriptTag({ content: shared }); await page.addScriptTag({ content: engine });
  return page;
}
async function preview(page, options = {}) {
  return page.evaluate(options => window.__surveyEngine.scan({ settings: options.settings || {}, data: options.data || {}, overrides: options.overrides || {} }), options);
}
async function fill(page, options = {}) {
  const view = await preview(page, options);
  const result = await page.evaluate(({ view, options }) => window.__surveyEngine.run({ ...options, settings: options.settings || {}, fingerprint: view.fingerprint, seed: view.seed, jobId: 'browser-test' }), { view, options });
  return { view, result };
}
module.exports = { chromium, radio, pageFor, preview, fill, shared, engine };
