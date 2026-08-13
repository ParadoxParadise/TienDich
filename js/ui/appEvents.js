export function initAppEvents(Scraper, Translator, getGlossary) {
    const fetchBtn = document.getElementById('fetch-btn');
    const urlInput = document.getElementById('url-input');
    const translateBtn = document.getElementById('translate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    const sourceText = document.getElementById('source-text');
    const vpText = document.getElementById('vp-text');
    const targetText = document.getElementById('target-text');
    const loadingOverlay = document.getElementById('loading-overlay');
    const providerSelect = document.getElementById('provider-select');
    const apiKeyInput = document.getElementById('api-key');
    const apiBaseUrlInput = document.getElementById('api-base-url');

    // Scrape Action
    fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert("Vui lòng nhập link truyện!");
            return;
        }

        loadingOverlay.classList.remove('hidden');
        try {
            const text = await Scraper.fetchGeneric(url);
            sourceText.innerText = text;
            translateBtn.click();
        } catch (error) {
            alert(error.message);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });

    // Translate Action
    translateBtn.addEventListener('click', async () => {
        let text = sourceText.innerText.trim();
        if (!text) {
            alert("Vui lòng nhập văn bản tiếng Trung cần dịch!");
            return;
        }

        // Wrap with <p> for sync and <span class="zh-char"> for popup source tracking
        const paragraphs = text.split('\n').filter(p => p.trim());
        sourceText.innerHTML = paragraphs.map((p, i) => {
            const chars = Array.from(p).map((c, idx) => `<span class="zh-char" data-idx="${idx}">${c}</span>`).join('');
            return `<p data-index="${i}">${chars}</p>`;
        }).join('');
        text = paragraphs.join('\n\n');

        const provider = providerSelect.value;
        const key = apiKeyInput.value.trim();
        const baseUrl = apiBaseUrlInput ? apiBaseUrlInput.value.trim() : '';
        const noKeyProviders = ['google', 'deeplx', 'mymemory']; 

        if (!noKeyProviders.includes(provider) && !key && provider !== 'custom_openai') {
            alert(`Vui lòng nhập API Key cho ${provider}!`);
            document.getElementById('settings-modal').classList.remove('hidden');
            return;
        }

        loadingOverlay.classList.remove('hidden');
        targetText.innerHTML = '';
        vpText.innerHTML = '';

        try {
            const glossary = getGlossary();
            
            // 1. Dịch Vietphrase siêu tốc
            if (window.VietPhrase) {
                vpText.innerHTML = paragraphs.map((p, i) => {
                    const vp = window.VietPhrase.translate(p, glossary);
                    return `<p data-index="${i}">${vp}</p>`;
                }).join('');
            } else {
                vpText.innerHTML = '<p>Đang tải từ điển VietPhrase, vui lòng thử lại sau...</p>';
            }

            // 2. Dịch mượt qua API AI
            await Translator.translate(text, provider, key, glossary, (chunk) => {
                const lines = chunk.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        let p = document.createElement('p');
                        p.textContent = line;
                        targetText.appendChild(p);
                    } else if (line === '') {
                        let br = document.createElement('br');
                        targetText.appendChild(br);
                    }
                });
                
                // Set data-index cho các thẻ p ở cột đích để cuộn đồng bộ
                const pTags = targetText.querySelectorAll('p');
                pTags.forEach((p, index) => {
                    if (!p.hasAttribute('data-index')) {
                        p.setAttribute('data-index', index);
                    }
                });
                targetText.scrollTop = targetText.scrollHeight;
            }, baseUrl);

        } catch (error) {
            console.error(error);
            alert("Lỗi dịch thuật: " + error.message);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = targetText.innerText;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => icon.className = 'fa-regular fa-copy', 2000);
        });
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ nội dung?')) {
            sourceText.innerHTML = '';
            targetText.innerHTML = '';
            vpText.innerHTML = '';
            urlInput.value = '';
        }
    });

    // --- Paragraph Synchronization (Đồng bộ hàng highlight) ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('.vp-word') || e.target.closest('.vp-name') || e.target.closest('.zh-char') || 
            e.target.closest('.stv-popup') || e.target.closest('.modal')) {
            return;
        }

        const p = e.target.closest('p[data-index]');
        if (p) {
            const index = p.getAttribute('data-index');
            document.querySelectorAll('p.highlight-active').forEach(el => el.classList.remove('highlight-active'));
            document.querySelectorAll(`p[data-index="${index}"]`).forEach(el => el.classList.add('highlight-active'));
        } else {
            document.querySelectorAll('p.highlight-active').forEach(el => el.classList.remove('highlight-active'));
        }
    });
}
