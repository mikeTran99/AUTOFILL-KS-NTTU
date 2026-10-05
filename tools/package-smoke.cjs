'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, mkdirSync, rmSync, readdirSync } = require('node:fs');
const { createHash } = require('node:crypto');
const os = require('node:os'), path = require('node:path');
const root = path.resolve(__dirname, '..'), version = JSON.parse(readFileSync(path.join(root, 'manifest.json'))).version;
const zip = path.join(root, 'dist', `AUTOFILL-KS-NTTU-v${version}.zip`);
const scratch = mkdtempSync(path.join(os.tmpdir(), 'autofill-package-'));
const extensionPath = path.join(scratch, 'extension'); mkdirSync(extensionPath);
const quotePS = value => `'${value.replaceAll("'", "''")}'`;
(async () => {
  let context;
  try {
    if (process.platform === 'win32') execFileSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${quotePS(zip)} -DestinationPath ${quotePS(extensionPath)}`]);
    else execFileSync('unzip', ['-q', zip, '-d', extensionPath]);
    for (const file of ['shared.js', 'content.js', 'background.js', 'popup.js', 'popup.html', 'popup.css', 'manifest.json']) assert.equal(createHash('sha256').update(readFileSync(path.join(extensionPath, file))).digest('hex'), createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex'), file);
    assert.equal(readFileSync(path.join(extensionPath, 'Hướng Dẫn Sử Dụng Extension Khảo Sát.pdf')).subarray(0, 4).toString(), '%PDF');
    assert.ok(readdirSync(path.join(extensionPath, 'docs')).includes('BENCHMARK.md'));
    context = await chromium.launchPersistentContext(path.join(scratch, 'browser'), { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).hostname;
    const page = await context.newPage(); await page.goto(`chrome-extension://${id}/popup.html`);
    await page.waitForFunction(() => document.querySelectorAll('#profileFields input').length === 10);
    assert.equal(await page.locator('[role=tab]').count(), 3);
    assert.equal(await worker.evaluate(() => chrome.runtime.getManifest().version), version);
    console.log('ZIP round-trip verified: runtime hashes, PDF, docs and real MV3 panel with three tabs.');
  } finally {
    await context?.close();
    assert.ok(path.resolve(scratch).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(scratch).startsWith('autofill-package-'));
    rmSync(scratch, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
