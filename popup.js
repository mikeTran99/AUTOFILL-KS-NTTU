const fillBtn = document.getElementById('fillBtn');
const defaultButtonText = fillBtn.innerText;

function setButtonBusy(text) {
    fillBtn.innerText = text;
    fillBtn.style.opacity = '0.7';
    fillBtn.style.pointerEvents = 'none';
}

function restoreButton() {
    fillBtn.innerText = defaultButtonText;
    fillBtn.style.background = '';
    fillBtn.style.opacity = '1';
    fillBtn.style.pointerEvents = 'auto';
}

fillBtn.addEventListener('click', async () => {
    const data = {
        "Tên môn học": document.getElementById('tenMonHoc').value,
        "Giảng viên": document.getElementById('giangVien').value,
        "Mã môn học": document.getElementById('maMonHoc').value,
        "Khoa": document.getElementById('khoa').value,
        "Học kỳ": document.getElementById('hocKy').value,
        "Năm học": document.getElementById('namHoc').value
    };
    
    // Lấy giá trị của dropdown 5 mức độ
    const mucDoText = document.getElementById('mucDo').value;

    setButtonBusy("ĐANG CHẠY...");

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            throw new Error("Không tìm thấy tab đang mở.");
        }

        if (!/^https?:\/\//i.test(tab.url || "")) {
            throw new Error("Hãy mở trang khảo sát dạng http/https rồi chạy lại.");
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        await chrome.tabs.sendMessage(tab.id, { action: "fill_survey", data: data, mucDo: mucDoText });

        setTimeout(() => {
            fillBtn.innerText = "HOÀN TẤT!";
            fillBtn.style.background = "linear-gradient(135deg, #4caf50, #2e7d32)";

            setTimeout(() => {
                // Giữ Side Panel mở để người dùng chạy tiếp cho khảo sát khác.
                restoreButton();
            }, 2500);
        }, 500);
    } catch (error) {
        console.error(error);
        alert(`Không thể chạy Auto Fill: ${error.message || "Vui lòng thử lại trên trang khảo sát."}`);
        restoreButton();
    }
});
