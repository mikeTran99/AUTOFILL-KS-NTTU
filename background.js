try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.warn(error));
} catch (e) {
  console.warn("Trình duyệt không hỗ trợ setPanelBehavior. Đang dùng phương pháp dự phòng...");
}

// Phương pháp dự phòng an toàn cho Cốc Cốc / Chrome cũ
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
  }
});
