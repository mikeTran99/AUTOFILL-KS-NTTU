'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm');
const { readFileSync } = require('node:fs');
const P = require('../shared.js');
function setup() {
  let listener, data = {}, set = async value => { data = structuredClone(value); };
  const chrome = { runtime: { id: 'test', getURL: file => `chrome-extension://test/${file}`, onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener() {} } },
    sidePanel: { setPanelBehavior: async () => {} }, action: { onClicked: { addListener() {} } },
    storage: { local: { get: async () => structuredClone(data), set: value => set(value) } } };
  vm.runInNewContext(readFileSync('background.js', 'utf8'), { chrome, SurveyPolicy: P, importScripts() {}, console });
  const sender = { id: 'test', url: 'chrome-extension://test/popup.html' };
  const request = message => new Promise(resolve => { assert.equal(listener(message, sender, resolve), true); });
  return { request, getData: () => data, setWriter: fn => { set = fn; }, listener, sender };
}
test('MV3 profile acknowledgement waits for storage; concurrent writes do not lose data', async () => {
  const env = setup(); let release; const gate = new Promise(resolve => { release = resolve; }); let writes = [];
  env.setWriter(async value => { await gate; writes.push(value); });
  let acknowledged = false;
  const first = env.request({ action: 'profile_save', name: 'A', profile: { schemaVersion: 1, settings: {}, data: {} } }).then(value => { acknowledged = true; return value; });
  for (let i = 0; i < 50; i++) await Promise.resolve();
  assert.equal(acknowledged, false); assert.equal(writes.length, 0); release(); assert.equal((await first).ok, true);
  // Fresh environment with durable writes; the second request reads after the first commits.
  const durable = setup();
  const values = await Promise.all(['A', 'B'].map(name => durable.request({ action: 'profile_save', name, profile: { schemaVersion: 1, settings: {}, data: {} } })));
  assert.equal(values.every(value => value.ok), true); assert.deepEqual(Object.keys(durable.getData().profiles), ['A', 'B']);
});
test('worker rejects untrusted callers and malformed profiles, then continues after storage errors', async () => {
  const env = setup(); let denied;
  env.listener({ action: 'profile_delete', name: 'A' }, { id: 'test', url: 'https://survey.example' }, value => { denied = value; }); assert.equal(denied.ok, false);
  assert.equal((await env.request({ action: 'profile_save', name: '__proto__', profile: {} })).ok, false);
  env.setWriter(async () => { throw new Error('Storage unavailable'); });
  assert.equal((await env.request({ action: 'profile_save', name: 'A', profile: { schemaVersion: 1, settings: {}, data: {} } })).ok, false);
  env.setWriter(async () => {});
  assert.equal((await env.request({ action: 'profile_save', name: 'B', profile: { schemaVersion: 1, settings: {}, data: {} } })).ok, true);
});
