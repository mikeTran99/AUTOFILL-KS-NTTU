if (!window.hasAutoFillScript) {
    window.hasAutoFillScript = true;
    
    // Hàm tạo độ trễ (delay)
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Hàm mô phỏng người đánh máy từng chữ
    async function typeTextHumanLike(element, text) {
        if (!element || !text) return;
        
        // Cuộn màn hình đến phần tử để người dùng thấy
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(400); // Chờ cuộn xong
        
        element.focus();
        element.value = '';
        
        // Gõ từng ký tự với độ trễ ngẫu nhiên từ 30ms đến 80ms
        for (let i = 0; i < text.length; i++) {
            element.value += text[i];
            
            // Kích hoạt sự kiện input để tương thích với các framework (React/Vue/Angular...)
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            await sleep(Math.random() * 50 + 30);
        }
        
        // Kích hoạt sự kiện change sau khi gõ xong
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();
    }

    // Hàm tìm ô nhập liệu (input/textarea) dựa vào text của nhãn (label)
    function findInputByText(text) {
        const inputSelector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])';
        const findEditableControl = (element) => {
            if (!element) return null;
            if (element.matches && element.matches(inputSelector)) return element;
            return element.querySelector ? element.querySelector(inputSelector) : null;
        };

        // Tìm tất cả các thẻ có chứa đoạn text tương ứng (không phân biệt hoa thường)
        const xpath = `//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${text.toLowerCase()}')]`;
        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        
        let el = iterator.iterateNext();
        while (el) {
            // Chỉ xét những thẻ lá (ít thẻ con) và nội dung không quá dài
            if (el.textContent.trim().length > 0 && el.textContent.trim().length < 100) {
                
                // 1. Tìm input bên trong chính thẻ cha
                let input = findEditableControl(el.parentElement);
                if (input) return input;
                
                // 2. Tìm input ở phần tử anh em tiếp theo (ví dụ: <td>Label</td> <td><input></td>)
                let sibling = el.nextElementSibling;
                while (sibling) {
                    input = findEditableControl(sibling);
                    if (input) return input;
                    sibling = sibling.nextElementSibling;
                }
                
                // 3. Tìm input ở thẻ anh em của thẻ cha
                let pSibling = el.parentElement.nextElementSibling;
                while (pSibling) {
                    input = findEditableControl(pSibling);
                    if (input) return input;
                    pSibling = pSibling.nextElementSibling;
                }
            }
            el = iterator.iterateNext();
        }
        return null;
    }

    // Hàm thực hiện điền tự động
    async function startSimulation(data, mucDoText) {
        console.log("Bắt đầu Auto Fill như người thật...");
        
        // 1. ĐIỀN THÔNG TIN CHUNG (từ popup)
        for (const [key, val] of Object.entries(data)) {
            if (!val) continue; // Bỏ qua nếu người dùng không nhập
            
            let input = findInputByText(key);
            if (input) {
                await typeTextHumanLike(input, val);
                await sleep(300); // Nghỉ một chút giữa các ô
            } else {
                console.warn(`Không tìm thấy ô nhập cho mục: ${key}`);
            }
        }
        
        // 2. ĐIỀN ĐÁNH GIÁ (Click radio buttons)
        const questionGroups = document.querySelectorAll('ul.group-cautraloi');
        
        // Chuyển đổi lựa chọn dropdown thành các từ khoá để tìm kiếm trong label HTML
        let searchKeywords = [mucDoText];
        if (mucDoText === "Hoàn toàn đồng ý") searchKeywords = ["Hoàn toàn đồng ý", "Rất hài lòng"];
        else if (mucDoText === "Đồng ý") searchKeywords = ["Đồng ý", "Hài lòng"];
        else if (mucDoText === "Phân vân") searchKeywords = ["Phân vân", "Bình thường"];
        else if (mucDoText === "Không đồng ý") searchKeywords = ["Không đồng ý", "Không hài lòng"];
        else if (mucDoText === "Hoàn toàn không đồng ý") searchKeywords = ["Hoàn toàn không đồng ý", "Rất tệ", "Rất không hài lòng"];

        if (questionGroups.length > 0) {
            for (let i = 0; i < questionGroups.length; i++) {
                const ul = questionGroups[i];
                let labelFound = null;
                
                for (const text of searchKeywords) {
                    labelFound = Array.from(ul.querySelectorAll('label')).find((label) => label.textContent.includes(text));
                    if (labelFound) break;
                }
                
                if (labelFound) {
                    // Cuộn tới câu hỏi
                    labelFound.scrollIntoView({ behavior: "smooth", block: "center" });
                    await sleep(150 + Math.random() * 150); // Chờ 150-300ms (giả vờ đọc)
                    
                    // Tạo hiệu ứng click
                    labelFound.style.transition = 'all 0.1s';
                    labelFound.style.transform = 'scale(0.9)'; // Ấn xuống
                    await sleep(80);
                    labelFound.click(); // Click thật
                    labelFound.style.transform = 'scale(1)'; // Nhả ra
                }
            }
        } else {
            console.warn("Không tìm thấy các câu hỏi trắc nghiệm (ul.group-cautraloi).");
        }
        
        // 3. ĐIỀN CÁC Ô GÓP Ý (Textarea)
        const textareas = document.querySelectorAll('textarea');
        for (let i = 0; i < textareas.length; i++) {
            // Chỉ điền "ok" nếu ô đó đang trống
            if (!textareas[i].value || textareas[i].value.trim() === '') {
                await typeTextHumanLike(textareas[i], 'ok');
            }
        }
        
        // 4. THÔNG BÁO HOÀN THÀNH
        const sendButton = document.getElementById('btnGui');
        if (sendButton) {
            sendButton.scrollIntoView({ behavior: "smooth", block: "center" });
            
            setTimeout(() => {
                // Tạo một hiệu ứng nhấp nháy vào nút Gửi để chú ý
                const oldShadow = sendButton.style.boxShadow;
                sendButton.style.boxShadow = "0 0 20px red";
                setTimeout(() => sendButton.style.boxShadow = oldShadow, 500);
                setTimeout(() => sendButton.style.boxShadow = "0 0 20px red", 1000);
                setTimeout(() => sendButton.style.boxShadow = oldShadow, 1500);
                
                if(confirm("Khảo sát đã được điền xong toàn bộ!\nBạn có muốn tự động bấm nút GỬI luôn không?")) {
                    sendButton.click();
                }
            }, 1000);
        } else {
            alert("Khảo sát đã được điền xong toàn bộ! (Bạn hãy tự bấm Gửi nhé)");
        }
    }
    
    // Lắng nghe lệnh từ popup.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "fill_survey") {
            // Báo lại cho popup là đã nhận
            if(sendResponse) sendResponse({status: "started"});
            
            // Chạy bất đồng bộ
            startSimulation(request.data, request.mucDo);
            return true; 
        }
    });
}
