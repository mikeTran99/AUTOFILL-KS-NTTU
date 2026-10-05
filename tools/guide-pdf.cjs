'use strict';
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.resolve('HUONG_DAN_SU_DUNG.html')).href);
    await page.pdf({ path: path.resolve('Hướng Dẫn Sử Dụng Extension Khảo Sát.pdf'), format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '14mm', right: '14mm' } });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
