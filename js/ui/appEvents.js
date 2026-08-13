export function initAppEvents(Scraper, Translator, getGlossary) {
    const fetchBtn = document.getElementById('fetch-btn');
    const urlInput = document.getElementById('fanqie-url');
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
    const geminiModelSelect = document.getElementById('gemini-model-select');

    // === Chapter Navigation ===
    const prevBtn = document.getElementById('nav-prev-btn');
    const nextBtn = document.getElementById('nav-next-btn');
    let currentUrl = '';

    function updateNavButtons(nav) {
        if (prevBtn) {
            prevBtn.disabled = !nav?.prev;
            prevBtn.dataset.url = nav?.prev || '';
        }
        if (nextBtn) {
            nextBtn.disabled = !nav?.next;
            nextBtn.dataset.url = nav?.next || '';
        }
    }

    async function loadUrl(url) {
        if (!url) return;
        urlInput.value = url;
        currentUrl = url;
        updateNavButtons({});
        showStatus('⬇️ Đang tải chương...', 'loading');
        try {
            const text = await Scraper.fetchGeneric(url);
            sourceText.innerText = text;
            const nav = Scraper.getLastNav();
            updateNavButtons(nav);
            // Lưu lịch sử
            saveHistory(url, text.slice(0, 80));
            // Tự động dịch
            translateBtn.click();
        } catch (err) {
            showStatus('❌ ' + err.message, 'error');
        }
    }

    prevBtn?.addEventListener('click', () => loadUrl(prevBtn.dataset.url));
    nextBtn?.addEventListener('click', () => loadUrl(nextBtn.dataset.url));

    // === Fetch Action ===
    fetchBtn.addEventListener('click', async () => {
        const url = (urlInput?.value || '').trim();
        if (!url) { alert('Vui lòng nhập link truyện!'); return; }
        await loadUrl(url);
    });

    // === Progress Bar ===
    function setProgress(current, total) {
        const bar = document.getElementById('translate-progress');
        const label = document.getElementById('translate-progress-label');
        if (bar) {
            bar.style.display = total > 1 ? 'block' : 'none';
            bar.value = current;
            bar.max = total;
        }
        if (label) {
            label.textContent = total > 1 ? `Đoạn ${current}/${total}` : '';
        }
    }

    function showStatus(msg, type = 'info') {
        const el = document.getElementById('translate-status');
        if (el) {
            el.textContent = msg;
            el.className = `translate-status ${type}`;
            el.style.display = msg ? 'block' : 'none';
        }
        // Also update overlay
        const overlayMsg = document.querySelector('#loading-overlay p');
        if (overlayMsg) overlayMsg.textContent = msg;
    }

    // === Stop Button ===
    const stopBtn = document.getElementById('stop-translate-btn');
    stopBtn?.addEventListener('click', () => {
        Translator.abort();
        loadingOverlay.classList.add('hidden');
        showStatus('⏹️ Đã dừng dịch.', 'info');
        stopBtn.classList.add('hidden');
        translateBtn.disabled = false;
    });

    // === Translate Action ===
    translateBtn.addEventListener('click', async () => {
        let text = sourceText.innerText.trim();
        if (!text) { alert('Vui lòng nhập văn bản tiếng Trung cần dịch!'); return; }

        // Render source as paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim());
        sourceText.innerHTML = paragraphs.map((p, i) => {
            const chars = Array.from(p).map((c, idx) => `<span class="zh-char" data-idx="${idx}">${c}</span>`).join('');
            return `<p data-index="${i}">${chars}</p>`;
        }).join('');
        text = paragraphs.join('\n\n');

        const provider = providerSelect.value;
        const key = apiKeyInput.value.trim();
        const baseUrl = geminiModelSelect && provider === 'gemini'
            ? geminiModelSelect.value  // Gemini model name stored here
            : (apiBaseUrlInput ? apiBaseUrlInput.value.trim() : '');

        const noKeyProviders = ['google', 'bing', 'youdao', 'mymemory', 'deeplx'];
        if (!noKeyProviders.includes(provider) && !key && provider !== 'custom_openai') {
            alert(`Vui lòng nhập API Key cho ${provider}!`);
            document.getElementById('settings-modal').classList.remove('hidden');
            return;
        }

        loadingOverlay.classList.remove('hidden');
        stopBtn?.classList.remove('hidden');
        translateBtn.disabled = true;
        targetText.innerHTML = '';
        vpText.innerHTML = '';
        setProgress(0, 0);
        showStatus('🔄 Đang dịch VietPhrase...', 'loading');

        try {
            const glossary = getGlossary();

            // 1. VietPhrase (local, instant)
            if (window.VietPhrase && window.VietPhrase.isLoaded) {
                vpText.innerHTML = paragraphs.map((p, i) => {
                    const vp = window.VietPhrase.translate(p, glossary);
                    return `<p data-index="${i}">${vp}</p>`;
                }).join('');
            } else {
                vpText.innerHTML = '<p>Từ điển VietPhrase chưa sẵn sàng...</p>';
            }

            showStatus(`🌐 Đang dịch bằng ${provider}...`, 'loading');

            // 2. AI/API Translation with streaming
            await Translator.translate(
                text, provider, key, glossary,
                (chunk) => {
                    // Streaming: append chunk as paragraphs
                    chunk.split('\n').forEach(line => {
                        if (line.trim()) {
                            const p = document.createElement('p');
                            p.textContent = line;
                            targetText.appendChild(p);
                        } else if (line === '') {
                            targetText.appendChild(document.createElement('br'));
                        }
                    });
                    // Re-index for scroll sync
                    targetText.querySelectorAll('p').forEach((p, idx) => {
                        if (!p.hasAttribute('data-index')) p.setAttribute('data-index', idx);
                    });
                    targetText.scrollTop = targetText.scrollHeight;
                },
                baseUrl,
                (current, total) => {
                    setProgress(current, total);
                    showStatus(`🌐 Dịch đoạn ${current}/${total}...`, 'loading');
                }
            );

            showStatus('✅ Dịch hoàn thành!', 'success');
            setTimeout(() => showStatus('', ''), 3000);

        } catch (error) {
            if (error.name === 'AbortError') {
                showStatus('⏹️ Đã dừng.', 'info');
            } else {
                showStatus('❌ Lỗi: ' + error.message, 'error');
                console.error(error);
            }
        } finally {
            loadingOverlay.classList.add('hidden');
            stopBtn?.classList.add('hidden');
            translateBtn.disabled = false;
            setProgress(0, 0);
        }
    });

    // === Copy ===
    copyBtn?.addEventListener('click', () => {
        const text = targetText.innerText;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => icon.className = 'fa-regular fa-copy', 2000);
        });
    });

    // === Clear ===
    clearBtn?.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ nội dung?')) {
            sourceText.innerHTML = '';
            targetText.innerHTML = '';
            vpText.innerHTML = '';
            if (urlInput) urlInput.value = '';
            updateNavButtons({});
            showStatus('', '');
        }
    });

    // === Export TXT ===
    document.getElementById('export-txt-btn')?.addEventListener('click', () => {
        const vpContent = vpText.innerText.trim();
        const aiContent = targetText.innerText.trim();
        if (!vpContent && !aiContent) { alert('Không có nội dung để xuất!'); return; }
        const content = aiContent || vpContent;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `tien-dich-${Date.now()}.txt`;
        a.click();
    });

    // === History ===
    function saveHistory(url, preview) {
        try {
            const history = JSON.parse(localStorage.getItem('tien-dich-history') || '[]');
            const entry = { url, preview, ts: Date.now() };
            const filtered = history.filter(h => h.url !== url);
            filtered.unshift(entry);
            localStorage.setItem('tien-dich-history', JSON.stringify(filtered.slice(0, 20)));
            renderHistory();
        } catch {}
    }

    function renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;
        const history = JSON.parse(localStorage.getItem('tien-dich-history') || '[]');
        container.innerHTML = history.slice(0, 10).map(h => `
            <div class="history-item" data-url="${h.url}" title="${h.url}">
                <span class="history-preview">${h.preview}...</span>
                <small>${new Date(h.ts).toLocaleDateString('vi-VN')}</small>
            </div>
        `).join('');
        container.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => loadUrl(el.dataset.url));
        });
    }
    renderHistory();

    // === Paragraph Sync Highlight ===
    document.addEventListener('click', (e) => {
        if (e.target.closest('.vp-word') || e.target.closest('.zh-char') ||
            e.target.closest('.stv-popup') || e.target.closest('.modal')) return;

        const p = e.target.closest('p[data-index]');
        document.querySelectorAll('p.highlight-active').forEach(el => el.classList.remove('highlight-active'));
        if (p) {
            const index = p.getAttribute('data-index');
            document.querySelectorAll(`p[data-index="${index}"]`).forEach(el => el.classList.add('highlight-active'));
        }
    });
}
