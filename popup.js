'use strict';
const P = SurveyPolicy, $ = id => document.getElementById(id);
let preview = null, previewRequest = null, targetTab = null, overrides = {}, busy = false, report = null, profiles = {}, shown = 30, platform = 'nttu';
let progressTab = null, activeJobId = null, pollTimer = null;
const platformNotes = {
  nttu: 'NTTU / HTML: nhóm đánh giá, ma trận radio, chọn nhiều và thông tin môn học. Thang 2, 3, 5, 7, 10 mức đều dùng được.',
  google: 'Google Forms: câu chọn một/nhiều, thang tuyến tính, lưới và văn bản. Dropdown cần có đáp án trong trang; nếu chưa thấy, mở danh sách rồi quét lại.',
  microsoft: 'Microsoft Forms: nhóm lựa chọn HTML/ARIA, Likert, văn bản và điểm có giới hạn. Với widget riêng chưa nhận diện được, dùng lựa chọn từng câu hoặc tự điền.'
};
function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('bad', error); }
function setBusy(value) {
  busy = value;
  for (const element of document.querySelectorAll('main input, main select, main textarea, main button, .platform-tabs button')) element.disabled = value;
  $('fillBtn').disabled = value || !preview || !preview.plan.some(row => row.action === 'fill');
  $('stopBtn').hidden = !value || !activeJobId;
  $('progress').hidden = !value || !activeJobId;
  $('refreshPreview').disabled = value || !preview;
}
function settingsVisibility() {
  $('fixedSettings').hidden = $('mode').value !== 'fixed'; $('randomSettings').hidden = $('mode').value === 'fixed';
  $('weightSettings').hidden = $('mode').value !== 'weighted';
  $('scoreSettings').hidden = $('fixedMethod').value !== 'scale'; $('positionSettings').hidden = $('fixedMethod').value !== 'position'; $('labelSettings').hidden = $('fixedMethod').value !== 'text';
  $('textSettings').hidden = $('textMode').value === 'skip';
}
function readSettings() {
  const value = {};
  for (const [key, defaultValue] of Object.entries(P.DEFAULTS)) {
    if (key === 'weights') { value.weights = $('weights').value.split(',').map(item => item.trim() === '' ? NaN : Number(item)); continue; }
    const element = $(key);
    value[key] = typeof defaultValue === 'boolean' ? element.checked : typeof defaultValue === 'number' ? element.value.trim() === '' ? NaN : Number(element.value) : element.value;
  }
  return P.validate(value);
}
function writeSettings(value) {
  const s = P.settings(value);
  for (const [key, defaultValue] of Object.entries(P.DEFAULTS)) {
    if (key === 'weights') { $('weights').value = s.weights.join(', '); continue; }
    if (typeof defaultValue === 'boolean') $(key).checked = s[key]; else $(key).value = s[key];
  }
  settingsVisibility();
}
function readData() { return Object.fromEntries(Object.keys(P.FIELDS).map(key => [key, $(key).value.trim()])); }
function writeData(data = {}) { for (const key of Object.keys(P.FIELDS)) $(key).value = typeof data[key] === 'string' ? data[key] : ''; }
function invalidate() {
  preview = null; previewRequest = null;
  $('fillBtn').disabled = true; $('refreshPreview').disabled = true;
  $('previewHint').textContent = 'Cấu hình đã thay đổi. Quét lại để xem đáp án mới.';
}
function choosePlatform(value) {
  platform = value;
  for (const button of document.querySelectorAll('[data-platform]')) { const selected = button.dataset.platform === value; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; }
  $('platformText').textContent = platformNotes[value]; $('platformHelp').setAttribute('aria-labelledby', `tab-${value}`);
  // Switching the helper tab keeps the common policy and entered information.
}
async function tab() {
  const [current] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!current?.id || !/^https?:\/\//i.test(current.url || '')) throw new Error('Hãy mở trang khảo sát http/https. Nếu chuyển tab, bấm lại biểu tượng tiện ích để cấp quyền.');
  return current;
}
async function inject(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['shared.js', 'content.js'] });
}
async function message(tabId, payload) {
  const response = await chrome.tabs.sendMessage(tabId, payload);
  if (!response?.ok) throw new Error(response?.error || 'Trang chưa phản hồi. Hãy tải lại tiện ích và quét lại.');
  return response;
}
function renderQuestions() {
  $('questions').replaceChildren();
  if (!preview) return;
  const { questions, plan } = preview;
  $('questionCount').textContent = `${questions.length} câu`;
  $('previewHint').textContent = `${plan.filter(row => row.action === 'fill').length} câu sẽ điền · ${plan.filter(row => row.action === 'skip').length} câu bỏ qua. ${preview.warnings.join(' ')}`;
  questions.slice(0, shown).forEach((question, index) => {
    const box = document.createElement('div'); box.className = 'question';
    const heading = document.createElement('p'); heading.textContent = `${index + 1}. ${question.title}${question.required ? ' *' : ''}`;
    const meta = document.createElement('p'); meta.className = 'muted'; meta.textContent = `${question.type}${question.options.length ? ` · ${question.options.length} đáp án` : ''}${question.answered ? ' · Đã có câu trả lời' : ''}`;
    const answer = document.createElement('p'); answer.className = 'answer'; answer.textContent = plan[index].action === 'fill' ? `Sẽ điền: ${plan[index].answer || '(không chọn ô nào)'}` : `Bỏ qua: ${plan[index].reason}`;
    const select = document.createElement('select'); select.setAttribute('aria-label', `Cách điền câu ${index + 1}`);
    for (const [value, text] of [['auto', 'Theo cấu hình chung'], ['skip', 'Bỏ qua câu này'], ['value', 'Chọn / nhập riêng']]) select.add(new Option(text, value));
    select.value = overrides[question.id]?.mode || 'auto';
    const custom = document.createElement('div'); custom.hidden = select.value !== 'value';
    let editor;
    if (question.options.length) {
      editor = document.createElement('select'); editor.multiple = question.type === 'checkbox' || question.multiple;
      editor.setAttribute('aria-label', `Đáp án riêng câu ${index + 1}`);
      question.options.forEach((option, choice) => editor.add(new Option(`${choice + 1}. ${option.label}`, String(choice))));
      for (const option of editor.options) option.selected = (overrides[question.id]?.indexes || []).includes(Number(option.value));
      if (!editor.multiple && !overrides[question.id]?.indexes) editor.selectedIndex = 0;
      if (editor.multiple) { editor.size = Math.min(question.options.length, 6); const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Giữ Ctrl/Cmd để chọn nhiều đáp án.'; custom.append(hint); }
    } else {
      editor = document.createElement('textarea'); editor.rows = 2; editor.setAttribute('aria-label', `Nội dung riêng câu ${index + 1}`); editor.value = overrides[question.id]?.value || '';
    }
    function update() {
      if (select.value === 'auto') delete overrides[question.id];
      else overrides[question.id] = select.value === 'skip' ? { mode: 'skip' } : question.options.length ? { mode: 'value', indexes: Array.from(editor.selectedOptions).map(option => Number(option.value)) } : { mode: 'value', value: editor.value };
      custom.hidden = select.value !== 'value'; $('fillBtn').disabled = true;
      $('previewHint').textContent = 'Đáp án riêng đã thay đổi. Bấm Cập nhật đáp án trước khi điền.';
      previewRequest = null;
    }
    select.addEventListener('change', update); editor.addEventListener('input', update); editor.addEventListener('change', update);
    custom.append(editor); box.append(heading, meta, answer, select, custom); $('questions').append(box);
  });
  $('moreQuestions').hidden = shown >= questions.length;
}
async function scan(keepOverrides = false) {
  if (busy) return;
  setBusy(true); status('Đang quét câu hỏi…');
  try {
    const s = readSettings(), data = readData(), current = await tab();
    if (!keepOverrides || current.id !== targetTab?.id) { overrides = {}; shown = 30; }
    const seed = keepOverrides && preview?.seed ? preview.seed : s.seed;
    await inject(current.id);
    const payload = { action: 'survey_scan', settings: { ...s, seed }, data, overrides };
    const result = await message(current.id, payload);
    await chrome.storage.local.set({ preferences: s });
    targetTab = current; preview = result; previewRequest = { settings: { ...s, seed: result.seed }, data, overrides: structuredClone(overrides), fingerprint: result.fingerprint, seed: result.seed };
    $('tabInfo').textContent = `${current.title || new URL(current.url).hostname} · Nhận diện: ${result.platform}`;
    renderQuestions(); status(result.questions.length ? 'Xem lại đáp án trước khi điền.' : 'Chưa tìm thấy câu hỏi. Chờ trang tải hoặc mở khảo sát trong tab riêng.');
  } catch (error) { previewRequest = null; preview = null; status(error.message, true); }
  finally { setBusy(false); }
}
function renderReport(progress) {
  if (!progress.report) return;
  report = progress.report; $('resultCard').hidden = false;
  $('resultSummary').textContent = `Đã điền ${progress.filled ?? 0} · Bỏ qua ${progress.skipped ?? 0} · Lỗi ${progress.failed ?? 0}${progress.state === 'cancelled' ? ' · Đã dừng' : ''}`;
  $('resultWarnings').replaceChildren(); $('resultRows').replaceChildren();
  const warnings = [...(report.warnings || []), ...(report.requiredRemaining?.length ? [`Còn ${report.requiredRemaining.length} câu bắt buộc chưa có đáp án: ${report.requiredRemaining.join('; ')}`] : [])];
  for (const text of warnings) { const p = document.createElement('p'); p.className = 'hint bad'; p.textContent = text; $('resultWarnings').append(p); }
  for (const row of report.rows.filter(row => row.status !== 'filled').slice(0, 100)) { const p = document.createElement('p'); p.textContent = `${row.title}: ${row.reason}`; if (row.status === 'failed') p.className = 'bad'; $('resultRows').append(p); }
}
function onProgress(value) {
  if (!value?.ok) return;
  $('progress').max = Math.max(value.total || 1, 1); $('progress').value = value.done || 0;
  if (value.state === 'running') { status(`Đang điền ${value.done}/${value.total} · thành công ${value.filled} · lỗi ${value.failed}`); }
  else if (['completed', 'cancelled', 'failed'].includes(value.state)) {
    clearInterval(pollTimer); pollTimer = null; activeJobId = null;
    invalidate(); setBusy(false); renderReport(value);
    status(value.state === 'cancelled' ? 'Đã dừng. Các câu đã điền được giữ lại.' : value.state === 'failed' ? 'Tác vụ gặp lỗi. Quét lại trước khi thử tiếp.' : `Đã xử lý ${value.done}/${value.total} câu. Kiểm tra kết quả trước khi gửi.`, value.failed > 0 || value.state === 'failed');
  }
}
function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!activeJobId || !progressTab) return;
    try { const value = await message(progressTab, { action: 'survey_status' }); if (value.jobId === activeJobId) onProgress(value); }
    catch (error) { clearInterval(pollTimer); pollTimer = null; activeJobId = null; invalidate(); setBusy(false); status(`Mất kết nối với tab: ${error.message}`, true); }
  }, 800);
}
async function fill() {
  if (busy || !previewRequest || !targetTab) return;
  setBusy(true); status('Đang bắt đầu…');
  try {
    const current = await tab();
    if (current.id !== targetTab.id || current.url !== targetTab.url) throw new Error('Tab đã thay đổi. Hãy quét lại trang hiện tại.');
    progressTab = current.id; activeJobId = crypto.randomUUID(); setBusy(true); startPolling();
    await chrome.storage.session.set({ activeSurveyTab: progressTab });
    const result = await message(current.id, { action: 'survey_run', ...previewRequest, jobId: activeJobId });
    onProgress(result);
  } catch (error) { clearInterval(pollTimer); pollTimer = null; activeJobId = null; invalidate(); setBusy(false); status(error.message, true); }
}
function download(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function profileList(selected = '') {
  $('profileName').replaceChildren(new Option('Chọn hồ sơ…', ''));
  for (const name of Object.keys(profiles).sort()) $('profileName').add(new Option(name, name));
  $('profileName').value = selected;
}
function validProfile(value) {
  return P.profile(value);
}
async function saveProfile() {
  const name = $('newProfileName').value.trim();
  if (!name || name.length > 60 || ['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error('Nhập tên hồ sơ từ 1 đến 60 ký tự.');
  const entry = validProfile({ schemaVersion: 1, settings: readSettings(), data: readData(), platform });
  const response = await chrome.runtime.sendMessage({ action: 'profile_save', name, profile: entry });
  if (!response?.ok) throw new Error(response?.error || 'Chưa lưu được hồ sơ. Hãy thử lại.');
  profiles = response.profiles; profileList(name); status(`Đã lưu hồ sơ ${name}.`);
}
function safely(fn) { return (...args) => Promise.resolve().then(() => fn(...args)).catch(error => status(error.message, true)); }
// Bind listeners before touching storage so a read failure cannot disable the panel.
for (const [key, labels] of Object.entries(P.FIELDS)) {
  const wrapper = document.createElement('div'); if (['tenMonHoc', 'giangVien', 'hoTen', 'email'].includes(key)) wrapper.className = 'wide';
  const label = document.createElement('label'); label.htmlFor = key; label.textContent = labels[0];
  const input = document.createElement('input'); input.id = key; input.type = key === 'email' ? 'email' : 'text'; input.maxLength = 1000; input.autocomplete = 'off';
  wrapper.append(label, input); $('profileFields').append(wrapper);
}
for (const element of document.querySelectorAll('input:not([type="file"]), textarea, select')) if (!['profileName', 'newProfileName'].includes(element.id)) element.addEventListener('input', () => { settingsVisibility(); invalidate(); });
for (const button of document.querySelectorAll('[data-platform]')) {
  button.addEventListener('click', () => choosePlatform(button.dataset.platform));
  button.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const values = ['nttu', 'google', 'microsoft']; const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (values.indexOf(platform) + (event.key === 'ArrowRight' ? 1 : 2)) % 3; choosePlatform(values[index]); $(`tab-${values[index]}`).focus(); });
}
$('scanBtn').addEventListener('click', () => scan(false)); $('refreshPreview').addEventListener('click', () => scan(true));
$('moreQuestions').addEventListener('click', () => { shown += 30; renderQuestions(); });
$('fillBtn').addEventListener('click', fill);
$('stopBtn').addEventListener('click', safely(async () => { if (progressTab) { await message(progressTab, { action: 'survey_stop' }); status('Đang dừng sau thao tác hiện tại…'); } }));
$('saveProfile').addEventListener('click', safely(saveProfile));
$('loadProfile').addEventListener('click', safely(() => { const entry = validProfile(profiles[$('profileName').value]); writeSettings(entry.settings); writeData(entry.data); choosePlatform(entry.platform); invalidate(); status('Đã nạp hồ sơ. Quét lại để xem trước.'); }));
$('deleteProfile').addEventListener('click', safely(async () => { const name = $('profileName').value; if (!name) throw new Error('Chọn hồ sơ cần xóa.'); const response = await chrome.runtime.sendMessage({ action: 'profile_delete', name }); if (!response?.ok) throw new Error(response?.error || 'Chưa xóa được hồ sơ.'); profiles = response.profiles; profileList(); status('Đã xóa hồ sơ.'); }));
$('exportProfile').addEventListener('click', safely(() => download('autofill-profile.json', validProfile({ schemaVersion: 1, settings: readSettings(), data: readData(), platform }))));
$('importProfile').addEventListener('change', safely(async () => { const file = $('importProfile').files[0]; if (!file) return; try { if (file.size > 100000) throw new Error('Hồ sơ phải nhỏ hơn 100 KB.'); const entry = validProfile(JSON.parse(await file.text())); writeSettings(entry.settings); writeData(entry.data); choosePlatform(entry.platform); invalidate(); status('Đã nhập hồ sơ. Bấm Lưu để lưu tại trình duyệt.'); } finally { $('importProfile').value = ''; } }));
$('exportReport').addEventListener('click', () => { if (report) download('autofill-report.json', { schemaVersion: 1, exportedAt: new Date().toISOString(), ...report }); });
chrome.runtime.onMessage.addListener((value, sender) => { if (value.action === 'survey_progress' && sender.tab?.id === progressTab && value.jobId === activeJobId) onProgress(value.progress); });
chrome.tabs.onActivated.addListener(() => { if (!busy) { invalidate(); targetTab = null; overrides = {}; status('Tab đã thay đổi. Quét lại trang cần điền.'); } });
chrome.tabs.onUpdated.addListener((tabId, change) => { if (!busy && targetTab?.id === tabId && (change.status === 'loading' || change.url)) { invalidate(); overrides = {}; status('Trang đã thay đổi. Quét lại câu hỏi.'); } });
writeSettings(P.DEFAULTS); choosePlatform('nttu');
(async () => {
  try {
    const stored = await chrome.storage.local.get(['preferences', 'profiles']);
    if (stored.preferences) writeSettings(P.validate(stored.preferences));
    profiles = Object.fromEntries(Object.entries(stored.profiles || {}).flatMap(([name, value]) => { try { return [[name, validProfile(value)]]; } catch { return []; } })); profileList();
  } catch (error) { writeSettings(P.DEFAULTS); status(`Đang dùng cấu hình mặc định: ${error.message}`, true); }
  try {
    const stored = await chrome.storage.session.get('activeSurveyTab');
    if (stored.activeSurveyTab) {
      const value = await message(stored.activeSurveyTab, { action: 'survey_status' });
      if (value.state === 'running') { progressTab = stored.activeSurveyTab; activeJobId = value.jobId; setBusy(true); startPolling(); onProgress(value); }
      else if (value.report) renderReport(value);
    }
  } catch { /* The previously used tab may have been closed or navigated. */ }
})();
