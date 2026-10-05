'use strict';
importScripts('shared.js');
let profileWrites = Promise.resolve();
chrome.runtime.onMessage.addListener((request, sender, respond) => {
  if (!['profile_save', 'profile_delete'].includes(request?.action)) return;
  if (sender.id !== chrome.runtime.id || sender.url?.split(/[?#]/)[0] !== chrome.runtime.getURL('popup.html')) { respond({ ok: false, error: 'Chỉ bảng điều khiển được sửa hồ sơ.' }); return; }
  const operation = profileWrites.then(async () => {
    const name = request.name;
    if (typeof name !== 'string' || !name.trim() || name.length > 60 || ['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error('Tên hồ sơ không hợp lệ.');
    const stored = await chrome.storage.local.get('profiles');
    const profiles = { ...(stored.profiles || {}) };
    if (request.action === 'profile_save') {
      if (!Object.hasOwn(profiles, name) && Object.keys(profiles).length >= 30) throw new Error('Tối đa 30 hồ sơ; hãy xóa hồ sơ cũ.');
      profiles[name] = SurveyPolicy.profile(request.profile);
    } else delete profiles[name];
    await chrome.storage.local.set({ profiles });
    return { ok: true, profiles };
  });
  profileWrites = operation.catch(() => {});
  operation.then(respond).catch(error => respond({ ok: false, error: error.message }));
  return true;
});
function setupPanel() {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.warn);
  }
}
setupPanel();
chrome.runtime.onInstalled.addListener(setupPanel);
chrome.action.onClicked.addListener(tab => {
  if (chrome.sidePanel?.open) chrome.sidePanel.open({ windowId: tab.windowId }).catch(console.warn);
});
