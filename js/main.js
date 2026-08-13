import Scraper from './core/scraper.js';
import VietPhraseDict from './core/vietphrase.js';
import Translator from './core/translator.js';

import { initSettings } from './ui/settings.js';
import { initReaderControls } from './ui/reader.js';
import { initDictionaryPopup } from './ui/dictionaryPopup.js';
import { initNameModal } from './ui/nameModal.js';
import { initAppEvents } from './ui/appEvents.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo Settings và Glossary
    const settingsAPI = initSettings();
    
    // 2. Khởi tạo Reader (Font, Scroll Sync)
    initReaderControls();
    
    // 3. Khởi tạo Core VietPhrase
    window.VietPhrase = VietPhraseDict; // Gắn global để các file khác dùng tạm (hoặc dùng inject)
    
    const vpStatus = document.getElementById('vp-status');
    if (vpStatus) {
        vpStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải Vietphrase (36MB)...';
        vpStatus.className = 'status-badge loading';
    }

    try {
        await window.VietPhrase.init();
        if (vpStatus) {
            vpStatus.innerHTML = '<i class="fa-solid fa-check"></i> Vietphrase Đã Sẵn Sàng';
            vpStatus.className = 'status-badge success';
        }
        
        // Cập nhật lại từ điển người dùng vào VietPhrase
        window.VietPhrase.customDict = settingsAPI.getGlossary();
    } catch (e) {
        if (vpStatus) {
            vpStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Lỗi tải Từ điển!';
            vpStatus.className = 'status-badge error';
        }
    }

    // 4. Khởi tạo Popup Từ điển Mini
    const translateBtn = document.getElementById('translate-btn');
    const addGlossaryTerm = (zh, vi) => {
        if (!zh || !vi) return;
        const glossary = settingsAPI.getGlossary();
        glossary.push({ zh: zh.trim(), vi: vi.trim() });
        settingsAPI.saveGlossary(glossary);
        settingsAPI.renderGlossary();
    };
    initDictionaryPopup(translateBtn, addGlossaryTerm);
    initNameModal(addGlossaryTerm);

    // 5. Khởi tạo các sự kiện Dịch & Cào Truyện
    initAppEvents(Scraper, Translator, settingsAPI.getGlossary);
});
