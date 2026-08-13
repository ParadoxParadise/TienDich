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
    const apiBaseUrlInput = document.getElementById('api-base-url');
    
    const rawTextarea = document.getElementById('raw-dict-textarea');

    // --- initialization ---
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
    
    const savedProvider = localStorage.getItem('translation-provider') || 'gemini';
    providerSelect.value = savedProvider;
    const savedApiKey = localStorage.getItem('api-key') || '';
    apiKeyInput.value = savedApiKey;
    const savedApiBaseUrl = localStorage.getItem('api-base-url') || '';
    if(apiBaseUrlInput) apiBaseUrlInput.value = savedApiBaseUrl;

    function updateApiKeyVisibility() {
        if (providerSelect.value === 'google') {
            apiKeyGroup.classList.add('hidden');
        } else {
            apiKeyGroup.classList.remove('hidden');
        }
    }
    updateApiKeyVisibility();

    // --- events ---
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    });

    settingsToggle.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).style.display = 'block';
        });
    });

    providerSelect.addEventListener('change', () => {
        updateApiKeyVisibility();
        localStorage.setItem('translation-provider', providerSelect.value);
    });

    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('api-key', apiKeyInput.value.trim());
    });
    
    if(apiBaseUrlInput) {
        apiBaseUrlInput.addEventListener('input', () => {
            localStorage.setItem('api-base-url', apiBaseUrlInput.value.trim());
        });
    }

    // Glossary management
    function getGlossary() {
        return JSON.parse(localStorage.getItem('novel-glossary')) || [];
    }

    function saveGlossary(g) {
        localStorage.setItem('novel-glossary', JSON.stringify(g));
    }

    function renderGlossary() {
        const glossary = getGlossary();
        let rawText = glossary.map(item => `${item.zh}=${item.vi}`).join('\n');
        if (rawTextarea) rawTextarea.value = rawText;
        
        // Re-inject custom dict into VietPhrase
        if (window.VietPhrase) {
            window.VietPhrase.customDict = glossary;
        }
    }

    document.getElementById('raw-save-btn')?.addEventListener('click', () => {
        if (!rawTextarea) return;
        const lines = rawTextarea.value.split('\n');
        const newGlossary = [];
        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.split('=');
            if (parts.length >= 2) {
                newGlossary.push({
                    zh: parts[0].trim(),
                    vi: parts.slice(1).join('=').trim()
                });
            }
        });
        saveGlossary(newGlossary);
        renderGlossary();
        alert('Đã lưu danh sách name thành công!');
    });

    document.getElementById('raw-clear-btn')?.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xoá toàn bộ name?')) {
            if (rawTextarea) rawTextarea.value = '';
            document.getElementById('raw-save-btn')?.click();
        }
    });

    document.getElementById('raw-export-btn')?.addEventListener('click', () => {
        if (!rawTextarea) return;
        const blob = new Blob([rawTextarea.value], {type: 'text/plain;charset=utf-8'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'names.txt';
        a.click();
    });

    const rawFileInput = document.getElementById('raw-file-input');
    document.getElementById('raw-import-btn')?.addEventListener('click', () => {
        if (rawFileInput) rawFileInput.click();
    });

    rawFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            // Append
            const currentRaw = rawTextarea.value;
            rawTextarea.value = currentRaw + (currentRaw && !currentRaw.endsWith('\n') ? '\n' : '') + text;
            document.getElementById('raw-save-btn')?.click();
        };
        reader.readAsText(file);
    });

    renderGlossary();

    return { getGlossary, saveGlossary, renderGlossary };
}
