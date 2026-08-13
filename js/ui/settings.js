export function initSettings() {
    const themeToggle = document.getElementById('theme-toggle');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.getElementById('close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const providerSelect = document.getElementById('provider-select');
    const apiKeyInput = document.getElementById('api-key');
    const apiKeyGroup = document.getElementById('api-key-group');
    const apiBaseUrlGroup = document.getElementById('api-base-url-group');
    const apiBaseUrlInput = document.getElementById('api-base-url');
    const geminiModelGroup = document.getElementById('gemini-model-group');
    const geminiModelSelect = document.getElementById('gemini-model-select');
    const providerInfo = document.getElementById('provider-info');
    const rawTextarea = document.getElementById('raw-dict-textarea');

    // Provider descriptions
    const PROVIDER_INFO = {
        gemini: '✅ <b>Không cần proxy</b> — Miễn phí (15 req/phút). Lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent-color)">Google AI Studio</a>.',
        openai: '✅ <b>Không cần proxy</b> — GPT-4o-mini rẻ và nhanh. Lấy key tại <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent-color)">OpenAI</a>.',
        claude: '✅ <b>Không cần proxy</b> — Chất lượng dịch văn học rất tốt. Lấy key tại <a href="https://console.anthropic.com/" target="_blank" style="color:var(--accent-color)">Anthropic</a>.',
        deepseek: '✅ <b>Không cần proxy</b> — Giá siêu rẻ, tốt cho tiếng Trung. Lấy key tại <a href="https://platform.deepseek.com/" target="_blank" style="color:var(--accent-color)">DeepSeek</a>.',
        custom_openai: '🔧 Nhập URL endpoint của server AI local (Ollama, LM Studio, Sakura LLM...) vào ô API Base URL bên dưới.',
        google: '🆓 <b>Miễn phí, không cần key</b> — Chất lượng khá, giới hạn ~600 ký tự/lần.',
        bing: '🆓 <b>Miễn phí, không cần key</b> — Cần chạy server local (run_web.bat). Chất lượng khá.',
        youdao: '🆓 <b>Miễn phí, không cần key</b> — Cần chạy server local (run_web.bat). Tốt cho văn ngôn.',
        mymemory: '🆓 <b>Miễn phí, không cần key</b> — Giới hạn 450 ký tự/lần. Chất lượng thấp.',
        baidu: '🔑 Nhập key theo định dạng <b>AppID|AppSecret</b>. Lấy tại <a href="https://fanyi-api.baidu.com/" target="_blank" style="color:var(--accent-color)">Baidu API</a>. Cần chạy server local.',
        caiyun: '🔑 Nhập Token Caiyun. Lấy tại <a href="https://dashboard.caiyunapp.com/" target="_blank" style="color:var(--accent-color)">Caiyun</a>. Cần chạy server local.',
        deepl: '🔑 Nhập DeepL API Key (dạng xxx:fx cho free tier). <b>Chú ý:</b> DeepL chưa hỗ trợ Tiếng Việt, sẽ dịch sang Tiếng Anh.',
    };

    // Initialize theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    // Restore saved settings
    const savedProvider = localStorage.getItem('translation-provider') || 'gemini';
    if (providerSelect) providerSelect.value = savedProvider;
    if (apiKeyInput) apiKeyInput.value = localStorage.getItem('api-key') || '';
    if (apiBaseUrlInput) apiBaseUrlInput.value = localStorage.getItem('api-base-url') || '';
    if (geminiModelSelect) geminiModelSelect.value = localStorage.getItem('gemini-model') || 'gemini-2.0-flash';

    function updateProviderUI() {
        const val = providerSelect?.value || 'gemini';
        const noKey = ['google', 'bing', 'youdao', 'mymemory'];
        const needBaseUrl = ['custom_openai'];
        const needGeminiModel = ['gemini'];

        if (apiKeyGroup) apiKeyGroup.classList.toggle('hidden', noKey.includes(val));
        if (apiBaseUrlGroup) apiBaseUrlGroup.classList.toggle('hidden', !needBaseUrl.includes(val));
        if (geminiModelGroup) geminiModelGroup.style.display = needGeminiModel.includes(val) ? '' : 'none';
        if (providerInfo) providerInfo.innerHTML = PROVIDER_INFO[val] || '';

        // Update target pane title
        const titles = {
            gemini: 'Gemini AI', openai: 'ChatGPT', claude: 'Claude', deepseek: 'DeepSeek',
            custom_openai: 'Local AI', google: 'Google Translate', bing: 'Microsoft Bing',
            youdao: 'Youdao 有道', mymemory: 'MyMemory', baidu: 'Baidu 百度',
            caiyun: 'Caiyun 彩云', deepl: 'DeepL (Anh)'
        };
        const titleEl = document.getElementById('target-pane-title');
        if (titleEl) titleEl.textContent = `Bản dịch (${titles[val] || val})`;
    }
    updateProviderUI();

    // --- Events ---
    themeToggle?.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', !isDark);
        document.body.classList.toggle('light-mode', isDark);
        if (themeToggle) themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });

    settingsToggle?.addEventListener('click', () => settingsModal?.classList.remove('hidden'));
    closeModal?.addEventListener('click', () => settingsModal?.classList.add('hidden'));
    settingsModal?.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
            btn.classList.add('active');
            const tab = document.getElementById(btn.dataset.tab);
            if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
        });
    });

    providerSelect?.addEventListener('change', () => {
        updateProviderUI();
        localStorage.setItem('translation-provider', providerSelect.value);
    });

    apiKeyInput?.addEventListener('input', () => localStorage.setItem('api-key', apiKeyInput.value.trim()));
    apiBaseUrlInput?.addEventListener('input', () => localStorage.setItem('api-base-url', apiBaseUrlInput.value.trim()));
    geminiModelSelect?.addEventListener('change', () => localStorage.setItem('gemini-model', geminiModelSelect.value));

    // Glossary management
    function getGlossary() {
        return JSON.parse(localStorage.getItem('novel-glossary') || '[]');
    }
    function saveGlossary(g) {
        localStorage.setItem('novel-glossary', JSON.stringify(g));
    }
    function renderGlossary() {
        const glossary = getGlossary();
        const rawText = glossary.map(item => `${item.zh}=${item.vi}`).join('\n');
        if (rawTextarea) rawTextarea.value = rawText;
        if (window.VietPhrase) window.VietPhrase.customDict = glossary;
    }

    document.getElementById('raw-save-btn')?.addEventListener('click', () => {
        if (!rawTextarea) return;
        const newGlossary = rawTextarea.value.split('\n')
            .filter(l => l.trim())
            .map(line => {
                const idx = line.indexOf('=');
                if (idx < 1) return null;
                return { zh: line.slice(0, idx).trim(), vi: line.slice(idx + 1).trim() };
            })
            .filter(Boolean);
        saveGlossary(newGlossary);
        renderGlossary();
        alert(`Đã lưu ${newGlossary.length} từ thành công!`);
    });

    document.getElementById('raw-run-btn')?.addEventListener('click', () => {
        renderGlossary();
        document.getElementById('translate-btn')?.click();
    });

    document.getElementById('raw-clear-btn')?.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xoá toàn bộ từ điển?')) {
            if (rawTextarea) rawTextarea.value = '';
            document.getElementById('raw-save-btn')?.click();
        }
    });

    document.getElementById('raw-export-btn')?.addEventListener('click', () => {
        if (!rawTextarea) return;
        const blob = new Blob([rawTextarea.value], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'names.txt';
        a.click();
    });

    const rawFileInput = document.getElementById('raw-file-input');
    document.getElementById('raw-import-btn')?.addEventListener('click', () => rawFileInput?.click());
    rawFileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const current = rawTextarea?.value || '';
            if (rawTextarea) rawTextarea.value = current + (current && !current.endsWith('\n') ? '\n' : '') + ev.target.result;
            document.getElementById('raw-save-btn')?.click();
        };
        reader.readAsText(file);
    });

    // History clear button
    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ lịch sử đọc?')) {
            localStorage.removeItem('tien-dich-history');
            document.getElementById('history-list').innerHTML = '';
        }
    });

    renderGlossary();

    return { getGlossary, saveGlossary, renderGlossary };
}
