'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../shared.js');
const options = count => Array.from({ length: count }, (_, i) => ({ label: `Option ${i + 1}`, value: String(i + 1) }));
test('settings validate zeros and reject malformed values', () => {
  assert.equal(P.validate({ delayMs: 0, fixedScore: 0, checkboxMin: 0 }).fixedScore, 0);
  for (const invalid of [{ delayMs: NaN }, { checkboxMax: -1 }, { randomMin: 90, randomMax: 10 }, { weights: [0, 0, 0, 0, 0] }, { numericEnabled: 'true' }, { textMode: 'fixed' }, { mode: 'bad' }, { fixedPosition: 1.1 }]) assert.throws(() => P.validate(invalid));
  const first = P.settings(); first.weights[0] = 999; assert.equal(P.settings().weights[0], 1);
});
test('all common scale sizes are filled and fixed labels match exactly', () => {
  for (const count of [2, 3, 5, 7, 10]) assert.deepEqual(P.choose(options(count), P.validate(), P.random('a')), [count - 1]);
  const reversed = ['Hoàn toàn đồng ý', 'Đồng ý', 'Phân vân', 'Không đồng ý', 'Hoàn toàn không đồng ý'].map(label => ({ label }));
  assert.deepEqual(P.choose(reversed, P.validate(), P.random('a')), [0]);
  assert.deepEqual(P.choose(reversed, P.validate({ fixedMethod: 'text', fixedText: 'không đồng ý' }), P.random('a')), [3]);
  assert.deepEqual(P.choose(options(3), P.validate({ fixedMethod: 'position', fixedPosition: 4 }), P.random('a')), []);
  assert.deepEqual(P.choose([{ label: 'Có' }, { label: 'Có' }], P.validate({ fixedMethod: 'text', fixedText: 'Có' }), P.random('a')), []);
});
test('seeded sampling is repeatable, bounded and covers all eligible choices', () => {
  const first = P.random('2026'), second = P.random('2026');
  assert.deepEqual(Array.from({ length: 100 }, first), Array.from({ length: 100 }, second));
  const s = P.validate({ mode: 'random', randomMin: 50, randomMax: 100 });
  const rng = P.random('coverage'), counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < 10000; i++) counts[P.choose(options(5), s, rng)[0]]++;
  assert.deepEqual(counts.slice(0, 2), [0, 0]);
  for (const count of counts.slice(2)) assert.ok(count > 3000 && count < 3700);
});
test('weighted selection excludes zero weights and follows proportions', () => {
  const rng = P.random('weighted'), counts = [0, 0, 0, 0, 0];
  const s = P.validate({ mode: 'weighted', weights: [0, 0, 0, 1, 3] });
  for (let i = 0; i < 10000; i++) counts[P.choose(options(5), s, rng)[0]]++;
  assert.deepEqual(counts.slice(0, 3), [0, 0, 0]); assert.ok(counts[4] > 7200 && counts[4] < 7800);
});
test('checkbox sampling uses original positions without duplicates', () => {
  const rng = P.random('multiple'); const s = P.validate({ mode: 'random', randomMin: 50, checkboxMin: 3, checkboxMax: 3 });
  for (let i = 0; i < 100; i++) assert.deepEqual(P.chooseMany(options(5), s, rng).sort(), [2, 3, 4]);
  assert.equal(P.chooseMany(options(2), s, rng), null);
  assert.deepEqual(P.chooseMany(options(5), P.validate({ checkboxMin: 0, checkboxMax: 0 }), rng), []);
});
test('Vietnamese normalization handles diacritics without HTML parsing', () => {
  assert.equal(P.normalize(' HỌ VÀ TÊN * '), 'ho va ten'); assert.equal(P.normalize('Đồng ý'), 'dong y');
});
