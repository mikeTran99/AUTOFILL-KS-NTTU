/* Shared policy: no DOM, network or persistence side effects. */
(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({
    mode: 'fixed', fixedMethod: 'scale', fixedPosition: 1, fixedText: '', fixedScore: 100,
    randomMin: 0, randomMax: 100, weights: Object.freeze([1, 1, 1, 3, 5]), seed: '',
    checkboxMin: 1, checkboxMax: 1, textMode: 'skip', textTemplates: '',
    numericEnabled: false, overwrite: false, delayMs: 0, scroll: false
  });
  const FIELDS = Object.freeze({
    tenMonHoc: ['Tên môn học', 'tên học phần', 'course name'],
    giangVien: ['Giảng viên', 'tên giảng viên', 'giáo viên', 'lecturer', 'instructor'],
    maMonHoc: ['Mã môn học', 'mã học phần', 'course code'],
    lop: ['Lớp', 'lớp học phần', 'class'], maSV: ['Mã sinh viên', 'mssv', 'mã sv', 'student id'],
    hoTen: ['Họ tên', 'họ và tên', 'full name'], email: ['Email', 'thư điện tử'],
    khoa: ['Khoa', 'faculty'], hocKy: ['Học kỳ', 'semester'], namHoc: ['Năm học', 'academic year']
  });
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function settings(raw = {}) {
    const input = raw && typeof raw === 'object' ? raw : {};
    return { ...DEFAULTS, ...Object.fromEntries(Object.keys(DEFAULTS).filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])),
      weights: Array.isArray(input.weights) ? [...input.weights] : [...DEFAULTS.weights] };
  }
  function validate(raw) {
    const s = settings(raw);
    const names = { fixedPosition: 'Vị trí đáp án', fixedScore: 'Mức đánh giá', randomMin: 'Giới hạn mức dưới', randomMax: 'Giới hạn mức trên', checkboxMin: 'Số ô tối thiểu', checkboxMax: 'Số ô tối đa', delayMs: 'Thời gian nghỉ' };
    const number = (key, min, max, integer = true) => {
      if (typeof s[key] !== 'number' || !Number.isFinite(s[key]) || (integer && !Number.isInteger(s[key])) || s[key] < min || s[key] > max)
        throw new Error(`${names[key] || 'Giá trị'} phải từ ${min} đến ${max}.`);
    };
    if (!['fixed', 'random', 'weighted'].includes(s.mode)) throw new Error('Chế độ chọn không hợp lệ.');
    if (!['scale', 'position', 'text'].includes(s.fixedMethod)) throw new Error('Cách chọn cố định không hợp lệ.');
    if (!['skip', 'fixed', 'random'].includes(s.textMode)) throw new Error('Chế độ văn bản không hợp lệ.');
    number('fixedPosition', 1, 1000); number('fixedScore', 0, 100);
    number('randomMin', 0, 100); number('randomMax', 0, 100);
    number('checkboxMin', 0, 1000); number('checkboxMax', 0, 1000); number('delayMs', 0, 2000);
    if (s.randomMin > s.randomMax) throw new Error('Giới hạn ngẫu nhiên dưới phải ≤ giới hạn trên.');
    if (s.checkboxMin > s.checkboxMax) throw new Error('Số ô chọn tối thiểu phải ≤ tối đa.');
    if (s.weights.length !== 5 || s.weights.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1000) || !s.weights.some(n => n > 0))
      throw new Error('Nhập 5 trọng số từ 0 đến 1000; ít nhất một trọng số lớn hơn 0.');
    for (const key of ['numericEnabled', 'overwrite', 'scroll']) if (typeof s[key] !== 'boolean') throw new Error(`Giá trị ${key} không hợp lệ.`);
    for (const key of ['fixedText', 'seed', 'textTemplates']) if (typeof s[key] !== 'string' || s[key].length > 10000) throw new Error(`Nội dung ${key} không hợp lệ.`);
    if (s.fixedMethod === 'text' && s.mode === 'fixed' && !s.fixedText.trim()) throw new Error('Nhập nhãn đáp án cố định.');
    if (s.textMode !== 'skip' && !s.textTemplates.trim()) throw new Error('Nhập ít nhất một mẫu văn bản.');
    return s;
  }
  function random(seed) {
    if (!seed) return () => {
      const buffer = new Uint32Array(1);
      root.crypto.getRandomValues(buffer);
      return buffer[0] / 4294967296;
    };
    let state = 2166136261;
    for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return () => {
      state += 0x6D2B79F5;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }
  const integer = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));
  function score(label) {
    const text = normalize(label);
    const levels = [
      ['hoan toan khong dong y', 'rat khong hai long', 'rat te', 'strongly disagree', 'very dissatisfied'],
      ['khong dong y', 'khong hai long', 'kem', 'disagree', 'dissatisfied'],
      ['phan van', 'binh thuong', 'trung lap', 'neutral', 'average'],
      ['dong y', 'hai long', 'tot', 'agree', 'satisfied'],
      ['hoan toan dong y', 'rat hai long', 'rat tot', 'strongly agree', 'very satisfied']
    ];
    // Exact matches prevent "đồng ý" matching "không đồng ý".
    const index = levels.findIndex(labels => labels.includes(text));
    return index < 0 ? null : index * 25;
  }
  function optionScores(options) {
    const semantic = options.map(option => score(option.label));
    return semantic.every(value => value !== null) ? semantic : options.map((_, i) => options.length < 2 ? 100 : i * 100 / (options.length - 1));
  }
  function choose(options, s, rng) {
    if (!options.length) return [];
    if (s.mode === 'fixed') {
      if (s.fixedMethod === 'text') {
        const target = normalize(s.fixedText);
        const matches = options.map((option, i) => normalize(option.label) === target || normalize(option.value) === target ? i : -1).filter(i => i >= 0);
        return matches.length === 1 ? matches : [];
      }
      if (s.fixedMethod === 'position') return s.fixedPosition <= options.length ? [s.fixedPosition - 1] : [];
      const scores = optionScores(options);
      return [scores.reduce((best, value, i) => Math.abs(value - s.fixedScore) < Math.abs(scores[best] - s.fixedScore) ? i : best, 0)];
    }
    const scores = optionScores(options);
    const candidates = options.map((_, i) => i).filter(i => scores[i] >= s.randomMin && scores[i] <= s.randomMax);
    if (!candidates.length) return [];
    if (s.mode === 'random') return [candidates[integer(0, candidates.length - 1, rng)]];
    const weights = candidates.map(i => s.weights[Math.round(scores[i] / 25)]);
    const total = weights.reduce((sum, value) => sum + value, 0);
    if (!total) return [];
    let target = rng() * total;
    for (let i = 0; i < candidates.length; i++) { target -= weights[i]; if (target < 0) return [candidates[i]]; }
    return [candidates.at(-1)];
  }
  function chooseMany(options, s, rng) {
    const max = Math.min(options.length, s.checkboxMax);
    if (s.checkboxMin > max) return null;
    const count = integer(s.checkboxMin, max, rng);
    const selected = [], remaining = options.map((option, index) => ({ ...option, originalIndex: index }));
    if (s.mode === 'fixed') {
      const first = choose(options, s, rng)[0];
      if (count && first === undefined) return null;
      return Array.from({ length: count }, (_, offset) => (first + offset) % options.length);
    }
    // Select without replacement while retaining original scale positions.
    const scores = optionScores(options);
    while (selected.length < count && remaining.length) {
      const eligible = remaining.filter(option => scores[option.originalIndex] >= s.randomMin && scores[option.originalIndex] <= s.randomMax);
      if (!eligible.length) return null;
      const weights = eligible.map(option => s.mode === 'weighted' ? s.weights[Math.round(scores[option.originalIndex] / 25)] : 1);
      let target = rng() * weights.reduce((sum, weight) => sum + weight, 0);
      if (!weights.some(weight => weight > 0)) return null;
      let picked = eligible.at(-1);
      for (let i = 0; i < eligible.length; i++) { target -= weights[i]; if (target < 0) { picked = eligible[i]; break; } }
      selected.push(picked.originalIndex); remaining.splice(remaining.indexOf(picked), 1);
    }
    return selected;
  }
  function profile(value) {
    if (!value || typeof value !== 'object' || value.schemaVersion !== 1) throw new Error('Hồ sơ không đúng định dạng phiên bản 1.');
    const s = validate(value.settings), data = {};
    for (const key of Object.keys(FIELDS)) { const item = value.data?.[key] ?? ''; if (typeof item !== 'string' || item.length > 1000) throw new Error('Thông tin trong hồ sơ không hợp lệ.'); data[key] = item; }
    return { schemaVersion: 1, settings: s, data, platform: ['nttu', 'google', 'microsoft'].includes(value.platform) ? value.platform : 'nttu' };
  }
  const api = Object.freeze({ DEFAULTS, FIELDS, normalize, settings, validate, random, integer, choose, chooseMany, profile });
  root.SurveyPolicy = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
