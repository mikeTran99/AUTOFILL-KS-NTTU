// Read-only public GitHub discovery; no competitor code is executed.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs', 'research', new Date().toISOString().slice(0, 10));
const cache = path.join(root, 'tmp', 'competitive-research');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(cache, { recursive: true });
const queries = [
  '"google forms" autofill is:public',
  '"google forms" filler extension is:public',
  '"google forms" random is:public',
  '"google-forms" autofill is:public',
  '"microsoft forms" autofill is:public',
  '"microsoft forms" bot is:public',
  'survey autofill extension is:public',
  'survey filler is:public',
  '"form filler" extension is:public',
  '"form autofill" extension is:public',
  '"fake filler" is:public',
  '"khảo sát" extension is:public',
  '"khảo sát" "tự động" is:public',
  '"khao sat" autofill is:public',
  'NTTU survey is:public',
  'NTTU autofill is:public',
  'HUTECH survey is:public',
  '"danh gia" extension is:public',
  'Testofill is:public',
  'autofill benchmark is:public',
  'survey userscript is:public',
  'google forms userscript is:public',
];
const selected = [
  'mikeTran99/AUTOFILL-KS-NTTU', 'muratalperen/GoogleFormsAutoFiller',
  'holyjak/Testofill-chrome-extension', 'ronedata/form-filler-extension',
  'Nir-Bhay/google-forms-autofill-extension', 'kiron0/fillo',
  'ArtikTheOnlyOne/gemini-form-filler', 'Adam-ZS/GoogleForms',
  'Adam-ZS/Microsoft-Forms-Fill-Bot', 'tienthanh214/googleform-autofill-and-submit',
  'BeastBoy2209/google-forms-ai-autofiller', 'rauf17/form-forge',
  'deepak0x/ai-form-filler', 'AnuragRoque/FilloAI-Extension',
  'tmwclaxton/autoapplycv', 'AutomaApp/automa', 'tohodo/autofill',
  'FakeFiller/fake-filler-extension', 'thuyydt/formfiller',
  'dat1208/script-hutech-survey', 'hcdkhanh/autosurvey',
  'ngntrgduc/HCMUS-danh-gia-mon-hoc', 'qvanphong/vhu-auto-survey',
  'leducnh1290/Auto-Select-Survey', 'kumorikuma/survey_autofill_extension',
];
const sourceFiles = {
  'muratalperen/GoogleFormsAutoFiller': ['scripts/GoogleForm.js', 'test/core.test.js', 'manifest.json'],
  'holyjak/Testofill-chrome-extension': ['src/extension/content/testofill-run.js', 'src/extension/content/generative.js'],
  'ronedata/form-filler-extension': ['src/content/filler.js', 'src/common/formmap.js'],
  'Nir-Bhay/google-forms-autofill-extension': ['content.js'],
  'kiron0/fillo': ['src/features/content/form-dom.ts', 'src/core/matching.ts', 'tests/content-dom.test.ts'],
  'ArtikTheOnlyOne/gemini-form-filler': ['content/content.js'],
  'rauf17/form-forge': ['content.js'],
  'FakeFiller/fake-filler-extension': ['src/common/element-filler.ts', 'src/common/fake-filler.ts'],
  'thuyydt/formfiller': ['content.ts', 'docs/demos/form-vi.html'],
  'dat1208/script-hutech-survey': ['script.js'],
  'hcdkhanh/autosurvey': ['getlink.js'],
  'ngntrgduc/HCMUS-danh-gia-mon-hoc': ['main.js'],
  'kumorikuma/survey_autofill_extension': ['content-script.js'],
  'AutomaApp/automa': ['src/utils/handleFormElement.js', 'src/content/blocksHandler/handlerForms.js'],
  'tmwclaxton/autoapplycv': ['scripts/extension-benchmark/README.md', 'scripts/extension-benchmark/lib/stats.mjs'],
  'tohodo/autofill': ['news-2024.md'],
};
const api = (endpoint, args = []) => JSON.parse(execFileSync('gh', ['api', endpoint, ...args], {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
}));
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const metadata = r => ({ repo: r.full_name, url: r.html_url, stars: r.stargazers_count,
  pushedAt: r.pushed_at, archived: r.archived, defaultBranch: r.default_branch,
  license: r.license?.spdx_id || null, topics: r.topics || [] });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const discovery = { collectedAt: new Date().toISOString(), scope: 'Public GitHub repository search index; paginate up to the GitHub limit of 1000 results per query, sorted by stars. Default resumes local cache; --refresh fetches again. Web/store/manual discovery is recorded separately.', queries: [], candidates: [] };
  const seen = new Map();
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const file = path.join(cache, `search-${i}.json`);
    let result;
    if (fs.existsSync(file) && !process.argv.includes('--refresh')) result = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
      result = api('search/repositories', ['-X', 'GET', '-f', `q=${q}`, '-f', 'per_page=100', '-f', 'sort=stars']);
      assert(Array.isArray(result.items) && Number.isInteger(result.total_count));
      save(file, result);
      await pause(2200);
    }
    while (result.items.length < Math.min(result.total_count, 1000)) {
      const page = Math.floor(result.items.length / 100) + 1;
      const next = api('search/repositories', ['-X', 'GET', '-f', `q=${q}`, '-f', 'per_page=100', '-f', 'sort=stars', '-f', `page=${page}`]);
      if (!next.items.length) break;
      result.items.push(...next.items);
      result.incomplete_results ||= next.incomplete_results;
      save(file, result);
      await pause(2200);
    }
    discovery.queries.push({ q, fetchedAt: fs.statSync(file).mtime.toISOString(), total: result.total_count, fetched: result.items.length, pages: Math.ceil(result.items.length / 100), incomplete: result.incomplete_results, capped: result.total_count > result.items.length, repositories: result.items.map(r => r.full_name) });
    for (const r of result.items) seen.set(r.full_name, metadata(r));
    discovery.candidates = [...seen.values()].sort((a, b) => a.repo.localeCompare(b.repo));
    save(path.join(out, 'discovery.json'), discovery);
    console.log(`${i + 1}/${queries.length}: ${result.items.length}/${result.total_count} matches; ${seen.size} unique`);
  }
  const inventory = { collectedAt: new Date().toISOString(), ownRuntimeBaseline: '1a8c9c0c2cded8a23e8567ff9a28aeaf517ea3c2', method: 'GitHub REST metadata, HEAD commit, recursive tree and README, read only; source inspections are recorded in the report. No competitor runtime scores.', repositories: [] };
  const inventoryFile = path.join(out, 'repositories.json');
  const previous = fs.existsSync(inventoryFile) ? JSON.parse(fs.readFileSync(inventoryFile, 'utf8')).repositories : [];
  for (const name of selected) {
    const cached = previous.find(r => r.repo === name);
    if (cached && !process.argv.includes('--refresh')) { inventory.repositories.push(cached); continue; }
    try {
      const repo = api(`repos/${name}`);
      const commit = api(`repos/${name}/commits/${repo.default_branch}`);
      assert(/^[a-f0-9]{40}$/.test(commit.sha));
      const tree = api(`repos/${name}/git/trees/${commit.sha}?recursive=1`);
      const folder = path.join(cache, name.replace('/', '--'));
      fs.mkdirSync(folder, { recursive: true });
      save(path.join(folder, 'tree.json'), tree);
      let readme = null;
      try {
        const data = api(`repos/${name}/readme?ref=${commit.sha}`);
        readme = data.path;
        fs.writeFileSync(path.join(folder, 'README.source.md'), Buffer.from(data.content, 'base64'));
      } catch { /* Missing README is evidence, not a fatal collection error. */ }
      inventory.repositories.push({ ...metadata(repo), fetchedAt: new Date().toISOString(), sha: commit.sha, commitDate: commit.commit.committer.date, treeTruncated: tree.truncated, fileCount: tree.tree.filter(x => x.type === 'blob').length, readme, readmeUrl: readme ? `https://github.com/${name}/blob/${commit.sha}/${readme}` : null, evidence: [] });
      console.log(`Pinned ${name} @ ${commit.sha.slice(0, 8)}`);
    } catch (error) {
      inventory.repositories.push({ repo: name, error: String(error.stderr || error.message).slice(0, 600) });
      console.log(`Unavailable ${name}`);
    }
    save(inventoryFile, inventory);
  }
  for (const repo of inventory.repositories) {
    if (!repo.sha || !sourceFiles[repo.repo]) continue;
    repo.evidence = [];
    for (const file of sourceFiles[repo.repo]) {
      const localFile = path.join(cache, repo.repo.replace('/', '--'), file.replaceAll('/', '__') + '.source.txt');
      const url = `https://raw.githubusercontent.com/${repo.repo}/${repo.sha}/${file.split('/').map(encodeURIComponent).join('/')}`;
      try {
        if (!fs.existsSync(localFile) || process.argv.includes('--refresh')) {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = Buffer.from(await response.arrayBuffer());
          assert(data.length < 2 * 1024 * 1024, 'Source exceeds research size cap');
          fs.writeFileSync(localFile, data);
        }
        const data = fs.readFileSync(localFile);
        repo.evidence.push({ path: file, url: `https://github.com/${repo.repo}/blob/${repo.sha}/${file}`, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length, acquisition: 'Downloaded as .source.txt for static inspection; not executed' });
      } catch (error) { repo.evidence.push({ path: file, error: error.message }); }
    }
  }
  save(inventoryFile, inventory);
  console.log('Saved public discovery and version pins. Cached source stays in ignored tmp/.');
})().catch(error => { console.error(String(error.stderr || error.message)); process.exitCode = 1; });
