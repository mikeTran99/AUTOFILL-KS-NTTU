'use strict';
const { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const name = `AUTOFILL-KS-NTTU-v${manifest.version}`, output = path.join(root, 'dist'), folder = path.join(output, name);
const files = ['manifest.json', 'shared.js', 'content.js', 'background.js', 'popup.html', 'popup.js', 'popup.css', 'icon.png', 'LICENSE', 'README.md', 'PRIVACY.md', 'CHANGELOG.md', 'docs/BENCHMARK.md', 'docs/benchmark-results.json', 'HUONG_DAN_SU_DUNG.md', 'HUONG_DAN_SU_DUNG.html', 'Hướng Dẫn Sử Dụng Extension Khảo Sát.pdf'];
mkdirSync(folder, { recursive: true });
// Fail on unexpected stale files, and copy an explicit allowlist. No developer data ships.
function entries(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? entries(path.join(directory, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]);
}
for (const file of entries(folder)) if (!files.includes(file)) throw new Error(`Unexpected file in package: ${file}`);
for (const file of files) { if (!existsSync(path.join(root, file))) throw new Error(`Missing ${file}`); mkdirSync(path.dirname(path.join(folder, file)), { recursive: true }); copyFileSync(path.join(root, file), path.join(folder, file)); }
const topEntries = [...new Set(files.map(file => file.split('/')[0]))];
const quotePS = value => `'${value.replaceAll("'", "''")}'`;
const zip = path.join(output, `${name}.zip`);
if (process.platform === 'win32') execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Force -LiteralPath ${topEntries.map(file => quotePS(path.join(folder, file))).join(',')} -DestinationPath ${quotePS(zip)}`]);
else execFileSync('zip', ['-q', '-r', zip, ...topEntries], { cwd: folder });
const hash = createHash('sha256').update(readFileSync(zip)).digest('hex');
writeFileSync(path.join(output, 'SHA256SUMS.txt'), `${hash}  ${name}.zip\n`);
console.log(`${zip}\nSHA256 ${hash}\n${files.length} files; unpacked entry: ${folder}`);
