/* Runs only after a user action. Re-injection preserves the active job. */
(function () {
  'use strict';
  if (globalThis.__surveyEngine?.version === '2.0.0') return;
  const P = globalThis.SurveyPolicy;
  if (!P) throw new Error('Thiếu shared.js. Hãy tải lại tiện ích.');
  const ids = new WeakMap();
  let nextId = 0, job = null, lastReport = null;
  const id = element => {
    if (!ids.has(element)) ids.set(element, `q${++nextId}`);
    return ids.get(element);
  };
  const query = (root, selector) => Array.from(root.querySelectorAll(selector));
  const groupSelector = 'fieldset, [role="radiogroup"], [role="group"], [role="listitem"], .group-cautraloi, .question-item, .form-group, [data-automation-id="questionItem"], tr';
  function visible(element, geometry = true) {
    if (!element?.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    const view = element.ownerDocument.defaultView;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    }
    if (!geometry) {
      const details = element.closest('details:not([open])');
      return !details || !!element.closest('summary');
    }
    return element.getClientRects().length > 0 || Array.from(element.labels || []).some(label => label.getClientRects().length > 0);
  }
  const enabled = element => !element.matches(':disabled') && !element.readOnly && element.getAttribute('aria-disabled') !== 'true' && !element.closest('[aria-disabled="true"]');
  function references(element, attribute) {
    const tree = element.getRootNode();
    return (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean).map(key => tree.getElementById?.(key)?.textContent || '').join(' ').trim();
  }
  function labelText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('input, select, textarea, [role="listbox"], [role="radio"], [role="checkbox"]').forEach(node => node.remove());
    return clone.textContent;
  }
  function label(element) {
    const explicit = element.getAttribute('aria-label') || references(element, 'aria-labelledby');
    const linked = Array.from(element.labels || []).map(labelText).join(' ');
    return (explicit || linked || element.textContent || element.getAttribute('placeholder') || element.getAttribute('name') || element.id || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  }
  function title(element, container, choice = false) {
    if (!choice) {
      const explicit = element.getAttribute('aria-label') || references(element, 'aria-labelledby') || Array.from(element.labels || []).map(labelText).join(' ');
      if (explicit) return explicit.replace(/\s+/g, ' ').trim().slice(0, 500);
    }
    const heading = container?.querySelector('legend, [role="heading"], .question-title, [data-automation-id="questionTitle"], th');
    const containerLabel = container?.getAttribute('aria-label') || (container ? references(container, 'aria-labelledby') : '');
    if (heading || containerLabel) return (containerLabel || heading.textContent).trim().slice(0, 500);
    if (!choice) return label(element);
    const clone = container?.cloneNode(true);
    clone?.querySelectorAll('input, select, textarea, [role="radio"], [role="checkbox"], label, [role="option"]').forEach(node => node.remove());
    return (clone?.textContent?.replace(/\s+/g, ' ').trim() || element.name || element.getAttribute('name') || 'Câu hỏi chưa có nhãn').slice(0, 500);
  }
  function roots() {
    const result = [], warnings = [], seen = new Set();
    function visit(root) {
      if (seen.has(root)) return;
      seen.add(root); result.push(root);
      for (const node of query(root, '*')) {
        if (node.shadowRoot && visible(node)) visit(node.shadowRoot);
        if (node.tagName === 'IFRAME' && visible(node)) {
          try {
            if (node.contentDocument?.documentElement) visit(node.contentDocument);
            else warnings.push('Có iframe khác nguồn hoặc chưa tải; hãy mở khảo sát trong tab riêng.');
          } catch { warnings.push('Có iframe khác nguồn; hãy mở khảo sát trong tab riêng.'); }
        }
      }
    }
    visit(document);
    return { roots: result, warnings: [...new Set(warnings)] };
  }
  function listOptions(element) {
    const controlled = (element.getAttribute('aria-controls') || '').split(/\s+/).map(key => element.getRootNode().getElementById?.(key)).filter(Boolean);
    const nodes = [...new Set([element, ...controlled].flatMap(root => query(root, '[role="option"]')))];
    return nodes.filter(enabled).map(node => ({ node, label: label(node), value: node.getAttribute('data-value') || label(node) }))
      .filter(option => !/^(chọn|choose|select|chọn câu trả lời|select an option)$/i.test(option.label));
  }
  const answered = question => {
    if (['radio', 'checkbox'].includes(question.type)) return question.options.some(option => option.node.checked || option.node.getAttribute('aria-checked') === 'true');
    if (question.type === 'listbox') return question.options.some(option => option.node.getAttribute('aria-selected') === 'true') || !!question.node.getAttribute('data-value')?.trim();
    if (question.type === 'select') return Array.from(question.node.selectedOptions).some(option => option.value !== '' && !option.disabled);
    if (question.type === 'range') {
      const node = question.node;
      if (node.getAttribute('value')?.trim()) return true;
      const min = node.min === '' ? 0 : Number(node.min), max = node.max === '' ? 100 : Number(node.max);
      const step = node.step === 'any' ? 0 : node.step === '' ? 1 : Number(node.step);
      const center = min > max ? min : (min + max) / 2;
      const initial = step > 0 ? Math.min(max, min + Math.round((center - min) / step) * step) : center;
      return Math.abs(Number(node.value) - initial) > 1e-8;
    }
    return !!(question.node.isContentEditable ? question.node.textContent : question.node.value)?.trim();
  };
  function scan() {
    const questions = [], { roots: trees, warnings } = roots();
    for (const tree of trees) {
      const nativeGroups = new Map(), customGroups = new Map();
      for (const node of query(tree, 'input[type="radio"], input[type="checkbox"], [role="radio"], [role="checkbox"]')) {
        if (!visible(node) || !enabled(node)) continue;
        const type = node.type === 'radio' || node.getAttribute('role') === 'radio' ? 'radio' : 'checkbox';
        if (node.tagName === 'INPUT') {
          const container = node.closest(groupSelector) || node.parentElement;
          const owner = node.form || tree;
          const key = type === 'radio' && node.name ? `${id(owner)}:radio:${node.name}` : `${id(container)}:${type}:${type === 'radio' ? 'unnamed' : node.name || ''}`;
          if (!nativeGroups.has(key)) nativeGroups.set(key, { node, container, type, options: [] });
          nativeGroups.get(key).options.push({ node, label: label(node) || node.value, value: node.value });
        } else {
          if (node.querySelector('input[type="radio"], input[type="checkbox"]')) continue;
          const container = node.closest(type === 'radio' ? '[role="radiogroup"], tr, fieldset, [role="listitem"], [data-automation-id="questionItem"], .question-item, .form-group' : groupSelector) || node.parentElement;
          const key = `${id(container)}:${type}`;
          if (!customGroups.has(key)) customGroups.set(key, { node, container, type, options: [] });
          customGroups.get(key).options.push({ node, label: label(node), value: node.getAttribute('data-value') || label(node) });
        }
      }
      for (const group of [...nativeGroups.values(), ...customGroups.values()]) {
        questions.push({ ...group, id: `${id(group.node)}:${group.type}`, title: title(group.node, group.container, true),
          required: group.options.some(option => option.node.required || option.node.getAttribute('aria-required') === 'true') || group.container?.getAttribute('aria-required') === 'true' });
      }
      const selector = 'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="password"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]), textarea, select, [role="listbox"], [contenteditable="true"], [role="textbox"]';
      for (const node of query(tree, selector)) {
        if (!visible(node) || !enabled(node)) continue;
        if (node.tagName !== 'INPUT' && node.tagName !== 'TEXTAREA' && (node.querySelector('input, textarea, select, [contenteditable="true"]') || node.parentElement?.closest('[contenteditable="true"]'))) continue;
        const type = node.tagName === 'SELECT' ? 'select' : node.getAttribute('role') === 'listbox' ? 'listbox' : ['number', 'range'].includes(node.type) ? node.type : 'text';
        const options = type === 'select' ? Array.from(node.options).filter(option => !option.disabled && !option.parentElement.disabled && option.value !== '').map(option => ({ node: option, label: option.textContent.trim(), value: option.value })) : type === 'listbox' ? listOptions(node) : [];
        questions.push({ id: id(node), node, container: node.closest(groupSelector), type, inputType: node.type || 'text',
          title: title(node, node.closest(groupSelector)), options, required: node.required || node.getAttribute('aria-required') === 'true',
          multiple: !!node.multiple, min: node.min, max: node.max, step: node.step });
      }
    }
    const serialized = questions.map(q => ({ id: q.id, title: q.title, type: q.type, inputType: q.inputType, required: !!q.required,
      answered: answered(q), multiple: !!q.multiple, options: q.options.map(({ label, value }) => ({ label, value })), min: q.min || '', max: q.max || '', step: q.step || '' }));
    const fingerprint = JSON.stringify(serialized.map(({ answered: _, ...q }) => q));
    const platform = /docs\.google\.com$/.test(location.hostname) ? 'google' : /(^|\.)(forms\.office\.com|forms\.cloud\.microsoft)$/.test(location.hostname) ? 'microsoft' : /nttu/i.test(location.hostname) || document.querySelector('.group-cautraloi') ? 'nttu' : 'html';
    return { questions, serialized, fingerprint, warnings, platform };
  }
  function profileValue(question, data) {
    const prompt = P.normalize(question.title).replace(/\s+(?:required|bat buoc)$/, '');
    const matches = Object.entries(P.FIELDS).filter(([, aliases]) => aliases.some(alias => {
      const normalized = P.normalize(alias);
      return prompt === normalized || prompt.startsWith(`${normalized} `) || prompt.endsWith(` ${normalized}`);
    })).sort((a, b) => Math.max(...b[1].map(alias => P.normalize(alias).length)) - Math.max(...a[1].map(alias => P.normalize(alias).length)));
    if (!matches.length) return null;
    const key = matches[0][0];
    return { key, value: typeof data[key] === 'string' ? data[key].trim() : '' };
  }
  function plan(question, s, data, overrides, rng) {
    const override = Object.hasOwn(overrides, question.id) ? overrides[question.id] : null;
    if (override?.mode === 'skip') return { skip: 'Bạn chọn bỏ qua.' };
    if (!s.overwrite && answered(question)) return { skip: 'Đã có câu trả lời; bật ghi đè để thay đổi.' };
    if (override?.mode === 'value') {
      if (['radio', 'checkbox', 'select', 'listbox'].includes(question.type)) {
        const indexes = Array.isArray(override.indexes) ? override.indexes : [];
        if (!indexes.length || indexes.some(index => !Number.isInteger(index) || index < 0 || index >= question.options.length) || new Set(indexes).size !== indexes.length || ((!question.multiple && question.type !== 'checkbox') && indexes.length !== 1)) return { skip: 'Lựa chọn riêng không hợp lệ.' };
        return { indexes };
      }
      return typeof override.value === 'string' && override.value.trim() ? { value: override.value } : { skip: 'Chưa nhập nội dung riêng.' };
    }
    const profile = profileValue(question, data);
    if (profile !== null && !['radio', 'checkbox'].includes(question.type)) {
      const value = profile.value;
      if (!value) return { skip: 'Chưa nhập thông tin cá nhân / môn học tương ứng.' };
      if (['select', 'listbox'].includes(question.type)) {
        const matches = question.options.map((option, index) => P.normalize(option.label) === P.normalize(value) || P.normalize(option.value) === P.normalize(value) ? index : -1).filter(index => index >= 0);
        return matches.length === 1 ? { indexes: matches } : { skip: 'Không có đáp án khớp thông tin đã nhập.' };
      }
      return { value };
    }
    if (['radio', 'select', 'listbox', 'checkbox'].includes(question.type)) {
      if (!question.options.length) return { skip: 'Chưa tìm thấy đáp án. Hãy mở danh sách rồi quét lại.' };
      const indexes = question.type === 'checkbox' || question.multiple ? P.chooseMany(question.options, s, rng) : P.choose(question.options, s, rng);
      return indexes?.length || (indexes && s.checkboxMin === 0 && (question.type === 'checkbox' || question.multiple)) ? { indexes } : { skip: 'Không có đáp án phù hợp cấu hình.' };
    }
    if (['number', 'range'].includes(question.type)) {
      if (!s.numericEnabled) return { skip: 'Điền số/thanh điểm đang tắt.' };
      const min = question.min === '' ? (question.type === 'range' ? 0 : NaN) : Number(question.min);
      const max = question.max === '' ? (question.type === 'range' ? 100 : NaN) : Number(question.max);
      const step = question.step === '' || question.step === 'any' ? 1 : Number(question.step);
      if (![min, max, step].every(Number.isFinite) || min > max || step <= 0) return { skip: 'Cần min/max/step hợp lệ để điền số.' };
      const count = Math.floor((max - min) / step + 1e-8);
      if (count > 1000000) return { skip: 'Khoảng số quá lớn; nhập giá trị riêng.' };
      const score = s.mode === 'fixed' ? s.fixedScore : s.mode === 'random' ? P.integer(s.randomMin, s.randomMax, rng) : null;
      if (score === null) return { skip: 'Thanh điểm hỗ trợ cố định/ngẫu nhiên; nhập riêng cho trọng số.' };
      const position = Math.round(count * score / 100);
      return { value: String(Number((min + position * step).toFixed(10))) };
    }
    if (question.node.tagName !== 'TEXTAREA' && ['email', 'tel', 'url', 'date', 'time', 'month', 'week', 'datetime-local'].includes(question.inputType)) return { skip: 'Nhập thông tin cá nhân hoặc giá trị riêng.' };
    if (s.textMode === 'skip') return { skip: 'Ô văn bản đang để trống.' };
    const templates = s.textTemplates.split('\n').map(line => line.trim()).filter(Boolean);
    return { value: templates[s.textMode === 'random' ? P.integer(0, templates.length - 1, rng) : 0] };
  }
  const brief = (question, action) => ({ id: question.id, title: question.title, type: question.type, action: action.skip ? 'skip' : 'fill',
    answer: action.indexes ? action.indexes.map(index => question.options[index].label).join(' · ') : action.value || '', reason: action.skip || '' });
  function preview(request) {
    const s = P.validate(request.settings), data = request.data || {}, overrides = request.overrides || {};
    const view = scan(), seed = s.seed || String(crypto.getRandomValues(new Uint32Array(1))[0]);
    const actions = view.questions.map(question => plan(question, s, data, overrides, P.random(`${seed}:${question.id}`)));
    return { ok: true, platform: view.platform, questions: view.serialized, fingerprint: view.fingerprint, seed, warnings: view.warnings,
      plan: view.questions.map((question, index) => brief(question, actions[index])) };
  }
  function dispatch(element, name) {
    const EventConstructor = element.ownerDocument.defaultView.Event;
    element.dispatchEvent(new EventConstructor(name, { bubbles: true, composed: true }));
  }
  function setValue(element, value) {
    if (element.isContentEditable) { element.textContent = value; dispatch(element, 'input'); dispatch(element, 'change'); return; }
    const view = element.ownerDocument.defaultView;
    const prototype = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : element.tagName === 'SELECT' ? view.HTMLSelectElement.prototype : view.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    dispatch(element, 'input'); dispatch(element, 'change');
  }
  const checked = element => element.checked || element.getAttribute('aria-checked') === 'true';
  const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
  async function apply(question, action, delayMs) {
    // Scan already checks geometry. Avoid a forced full layout after every click on large forms.
    if (!question.node.isConnected || !visible(question.node, false) || !enabled(question.node)) throw new Error('Câu hỏi đã thay đổi hoặc bị khóa.');
    if (question.type === 'radio' || question.type === 'checkbox') {
      const selected = new Set(action.indexes);
      for (let i = 0; i < question.options.length; i++) {
        const node = question.options[i].node;
        if (!node.isConnected || !enabled(node)) throw new Error('Đáp án đã thay đổi.');
        if (question.type === 'radio' ? selected.has(i) && !checked(node) : checked(node) !== selected.has(i)) {
          if (node.tagName === 'BUTTON' && node.type === 'submit') throw new Error('Đáp án dùng nút gửi biểu mẫu; cần tự chọn.');
          node.click();
        }
      }
      await tick(delayMs);
      if (!question.node.isConnected) throw new Error('Câu hỏi được dựng lại; hãy quét để xác minh đáp án.');
      if (!question.options.every((option, i) => checked(option.node) === selected.has(i))) throw new Error('Trang chưa nhận lựa chọn.');
    } else if (question.type === 'select') {
      if (question.multiple) {
        for (const option of question.node.options) option.selected = false;
        for (const index of action.indexes) question.options[index].node.selected = true;
        dispatch(question.node, 'input'); dispatch(question.node, 'change');
      } else setValue(question.node, question.options[action.indexes[0]].value);
      await tick(delayMs);
      if (!question.node.isConnected) throw new Error('Danh sách được dựng lại; hãy quét để xác minh đáp án.');
      const values = Array.from(question.node.selectedOptions).map(option => option.value);
      if (values.length !== action.indexes.length || action.indexes.some(index => !values.includes(question.options[index].value))) throw new Error('Trang chưa nhận danh sách chọn.');
    } else if (question.type === 'listbox') {
      const target = question.options[action.indexes[0]];
      if (question.node.tagName === 'BUTTON' && question.node.type === 'submit') throw new Error('Danh sách dùng nút gửi biểu mẫu; cần tự chọn.');
      question.node.click(); await tick();
      if (!target.node.isConnected) throw new Error('Danh sách đã thay đổi; hãy mở và quét lại.');
      target.node.click(); await tick(delayMs);
      if (question.node.getAttribute('data-value') !== target.value && !listOptions(question.node).some(option => option.value === target.value && option.node.getAttribute('aria-selected') === 'true')) throw new Error('Chưa xác minh được lựa chọn trong danh sách.');
    } else {
      const node = question.node;
      if (node.maxLength >= 0 && action.value.length > node.maxLength) throw new Error(`Nội dung vượt giới hạn ${node.maxLength} ký tự.`);
      const old = node.isContentEditable ? node.textContent : node.value;
      setValue(node, action.value); await tick(delayMs);
      if (!node.isConnected) throw new Error('Ô nhập được dựng lại; hãy quét để xác minh giá trị.');
      if (node.validity && !node.validity.valid) { setValue(node, old); throw new Error('Giá trị không đáp ứng điều kiện của ô nhập.'); }
      const actual = node.isContentEditable ? node.textContent : node.value;
      if (actual !== action.value) throw new Error('Trang chưa nhận giá trị nhập.');
    }
  }
  function notify() {
    if (!job) return;
    try { chrome.runtime.sendMessage({ action: 'survey_progress', jobId: job.id, progress: status() }).catch(() => {}); } catch { /* Panel may be closed. */ }
  }
  function status() {
    return job ? { ok: true, state: job.state, jobId: job.id, total: job.total, done: job.done, filled: job.filled, skipped: job.skipped, failed: job.failed, report: job.state === 'running' ? null : job.report } : { ok: true, state: 'idle', report: lastReport };
  }
  async function run(request) {
    if (job?.state === 'running') throw new Error('Một tác vụ đang chạy. Hãy dừng hoặc đợi hoàn tất.');
    const s = P.validate(request.settings), view = scan();
    if (!request.fingerprint || request.fingerprint !== view.fingerprint) throw new Error('Biểu mẫu đã thay đổi. Hãy quét và xem trước lại.');
    const seed = request.seed || s.seed, overrides = request.overrides || {}, data = request.data || {};
    const actions = view.questions.map(question => plan(question, s, data, overrides, P.random(`${seed}:${question.id}`)));
    job = { id: request.jobId, state: 'running', total: actions.length, done: 0, filled: 0, skipped: 0, failed: 0, cancelled: false, report: { rows: [], warnings: [...view.warnings] } };
    notify();
    for (let i = 0; i < actions.length; i++) {
      if (job.cancelled) break;
      const question = view.questions[i], action = actions[i], row = brief(question, action);
      if (action.skip) { job.skipped++; row.status = 'skipped'; }
      else {
        try {
          if (!s.overwrite && answered(question)) { row.status = 'skipped'; row.reason = 'Câu trả lời vừa được cập nhật.'; job.skipped++; }
          else {
            if (s.scroll) question.node.scrollIntoView({ block: 'center', behavior: 'instant' });
            await apply(question, action, s.delayMs); row.status = 'filled'; job.filled++;
          }
        } catch (error) { row.status = 'failed'; row.reason = error.message; job.failed++; }
      }
      job.report.rows.push(row); job.done++;
      if (i % 5 === 0 || i === actions.length - 1) notify();
      if (row.status !== 'filled') await tick(s.delayMs);
    }
    job.state = job.cancelled ? 'cancelled' : 'completed';
    const after = scan();
    if (after.fingerprint !== view.fingerprint) job.report.warnings.push('Trang đã thay đổi sau khi điền. Quét lại để xử lý câu hỏi mới hoặc điều kiện rẽ nhánh.');
    job.report.requiredRemaining = after.questions.filter(question => question.required && ((question.type !== 'range' && !answered(question)) || question.options.some(option => option.node.required && option.node.validity?.valueMissing))).map(question => question.title);
    lastReport = job.report; notify();
    return status();
  }
  globalThis.__surveyEngine = { version: '2.0.0', scan: preview, run, status, cancel: () => { if (job?.state === 'running') job.cancelled = true; return status(); } };
  chrome.runtime.onMessage.addListener((request, _sender, respond) => {
    if (!['survey_scan', 'survey_run', 'survey_status', 'survey_stop'].includes(request?.action)) return;
    Promise.resolve().then(() => request.action === 'survey_scan' ? preview(request) : request.action === 'survey_run' ? run(request) : request.action === 'survey_stop' ? globalThis.__surveyEngine.cancel() : status())
      .then(respond).catch(error => { if (job?.state === 'running' && request.action === 'survey_run' && request.jobId === job.id) { job.state = 'failed'; notify(); } respond({ ok: false, error: error.message }); });
    return true;
  });
})();
