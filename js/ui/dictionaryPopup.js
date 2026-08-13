// Dùng global window.pinyinPro

export function initDictionaryPopup(translateBtn, addGlossaryTerm) {
    const selectionPopup = document.getElementById('selection-popup');
    const popupZh = document.getElementById('popup-zh');
    const popupVi = document.getElementById('popup-vi');
    const popupPy = document.getElementById('popup-py');
    const popupHv = document.getElementById('popup-hv');
    const popupHvCap = document.getElementById('popup-hv-cap');
    const popupSaveBtn = document.getElementById('popup-save-btn');
    const expandLeftBtn = document.getElementById('expand-left-btn');
    const expandRightBtn = document.getElementById('expand-right-btn');
    const sourceText = document.getElementById('source-text');
    const vpText = document.getElementById('vp-text');
    
    let currentPopupNodes = [];

    async function updatePopupFields(zhText) {
        if (!zhText) return;
        
        // Pinyin
        if (window.pinyinPro && window.pinyinPro.pinyin) {
            popupPy.value = window.pinyinPro.pinyin(zhText, { toneType: 'num' });
        } else {
            popupPy.value = "";
        }

        // Dịch nghĩa VietPhrase
        if (window.VietPhrase) {
            const vpMeaning = window.VietPhrase.translate(zhText, []);
            popupVi.value = vpMeaning.replace(/<[^>]*>?/gm, ''); // Strip HTML
        }
        
        // Hán Việt xịn (dùng helper method tập trung)
        let hvResult = "";
        if (window.VietPhrase && window.VietPhrase.getHanViet) {
            hvResult = window.VietPhrase.getHanViet(zhText);
        }
        
        if(popupHv) popupHv.value = hvResult;
        if(popupHvCap) popupHvCap.value = hvResult.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Google Translate (Tiếng Anh)
        const popupGg = document.getElementById('popup-gg');
        if (popupGg) {
            popupGg.value = "Đang dịch...";
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(zhText)}`;
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        const translated = data[0]?.map(item => item[0] || '').join('') || '';
                        popupGg.value = translated;
                    })
                    .catch(() => popupGg.value = "Lỗi mạng");
            } catch (e) {
                popupGg.value = "Lỗi";
            }
        }
    }

    function hidePopup() {
        selectionPopup.classList.add('hidden');
        document.querySelectorAll('.word-active').forEach(n => n.classList.remove('word-active'));
        currentPopupNodes = [];
    }

    function updatePopupFromNodes() {
        document.querySelectorAll('.word-active').forEach(n => n.classList.remove('word-active'));
        
        if (currentPopupNodes.length === 0) return;
        
        let zhText = "";
        let minStart = Infinity;
        let maxEnd = -1;
        let paragraphIndex = -1;

        currentPopupNodes.forEach(node => {
            node.classList.add('word-active');
            
            const p = node.closest('p[data-index]');
            if (p) paragraphIndex = parseInt(p.getAttribute('data-index'));

            if (node.classList.contains('vp-word') || node.classList.contains('vp-name')) {
                zhText += node.getAttribute('data-zh');
                const start = parseInt(node.getAttribute('data-start'));
                const end = parseInt(node.getAttribute('data-end'));
                if (!isNaN(start) && start < minStart) minStart = start;
                if (!isNaN(end) && end > maxEnd) maxEnd = end;
            } else if (node.classList.contains('zh-char')) {
                zhText += node.innerText;
                const idx = parseInt(node.getAttribute('data-idx'));
                if (!isNaN(idx) && idx < minStart) minStart = idx;
                if (!isNaN(idx) && idx + 1 > maxEnd) maxEnd = idx + 1;
            }
        });

        // --- BIDIRECTIONAL HIGHLIGHTING ---
        if (paragraphIndex !== -1 && minStart !== Infinity && maxEnd !== -1) {
            // Nếu đang chọn ở cột VietPhrase -> highlight cột Source
            if (currentPopupNodes[0].classList.contains('vp-word') || currentPopupNodes[0].classList.contains('vp-name')) {
                const sourceP = sourceText.querySelector(`p[data-index="${paragraphIndex}"]`);
                if (sourceP) {
                    sourceP.querySelectorAll('.zh-char').forEach(charNode => {
                        const idx = parseInt(charNode.getAttribute('data-idx'));
                        if (idx >= minStart && idx < maxEnd) {
                            charNode.classList.add('word-active');
                        }
                    });
                }
            } 
            // Nếu đang chọn ở cột Source -> highlight cột VietPhrase
            else if (currentPopupNodes[0].classList.contains('zh-char')) {
                const vpP = vpText.querySelector(`p[data-index="${paragraphIndex}"]`);
                if (vpP) {
                    vpP.querySelectorAll('.vp-word, .vp-name').forEach(vpNode => {
                        const start = parseInt(vpNode.getAttribute('data-start'));
                        const end = parseInt(vpNode.getAttribute('data-end'));
                        // Nếu từ VietPhrase giao cắt với vùng chữ Hán được chọn
                        if (!(end <= minStart || start >= maxEnd)) {
                            vpNode.classList.add('word-active');
                        }
                    });
                }
            }
        }
        
        popupZh.value = zhText;
        updatePopupFields(zhText);
    }

    expandLeftBtn.addEventListener('click', () => {
        if (currentPopupNodes.length === 0) return;
        const firstNode = currentPopupNodes[0];
        if (firstNode.previousElementSibling && 
           (firstNode.previousElementSibling.classList.contains('vp-word') || 
            firstNode.previousElementSibling.classList.contains('zh-char'))) {
            currentPopupNodes.unshift(firstNode.previousElementSibling);
            updatePopupFromNodes();
        }
    });

    expandRightBtn.addEventListener('click', () => {
        if (currentPopupNodes.length === 0) return;
        const lastNode = currentPopupNodes[currentPopupNodes.length - 1];
        if (lastNode.nextElementSibling && 
           (lastNode.nextElementSibling.classList.contains('vp-word') || 
            lastNode.nextElementSibling.classList.contains('vp-name') || 
            lastNode.nextElementSibling.classList.contains('zh-char'))) {
            currentPopupNodes.push(lastNode.nextElementSibling);
            updatePopupFromNodes();
        }
    });

    document.addEventListener('mouseup', async (e) => {
        if (selectionPopup.contains(e.target) || document.getElementById('name-modal')?.contains(e.target)) return;
        
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && text.length > 0 && text.length < 100 && e.target.closest('.translation-output')) {
            selectionPopup.style.left = `${e.pageX + 10}px`;
            selectionPopup.style.top = `${e.pageY + 10}px`;
            currentPopupNodes = [];
            
            if (e.target.closest('#vp-text') || e.target.closest('#source-text')) {
                const range = selection.getRangeAt(0);
                const commonAncestor = range.commonAncestorContainer;
                const parentBlock = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement.closest('p, .translation-output') : commonAncestor.closest('p, .translation-output');
                
                if (parentBlock) {
                    const allSpans = parentBlock.querySelectorAll('.vp-word, .vp-name, .zh-char');
                    allSpans.forEach(span => {
                        const spanRange = document.createRange();
                        spanRange.selectNodeContents(span);
                        const isBefore = spanRange.compareBoundaryPoints(Range.END_TO_START, range) <= 0;
                        const isAfter = spanRange.compareBoundaryPoints(Range.START_TO_END, range) >= 0;
                        if (!isBefore && !isAfter) {
                            currentPopupNodes.push(span);
                        }
                    });
                }
                
                if (currentPopupNodes.length === 0) {
                    const parent = selection.anchorNode.parentElement;
                    if (parent && (parent.classList.contains('vp-word') || parent.classList.contains('vp-name') || parent.classList.contains('zh-char'))) {
                        currentPopupNodes.push(parent);
                    }
                }
                
                expandLeftBtn.style.display = 'inline-block';
                expandRightBtn.style.display = 'inline-block';
                updatePopupFromNodes();
            } else {
                expandLeftBtn.style.display = 'none';
                expandRightBtn.style.display = 'none';
                popupZh.value = text;
                popupVi.value = '';
                updatePopupFields(text);
            }

            selectionPopup.classList.remove('hidden');
            popupVi.focus();
        } else if (e.target.closest('.vp-word') || e.target.closest('.vp-name') || e.target.closest('.zh-char')) {
            const node = e.target.closest('.vp-word') || e.target.closest('.vp-name') || e.target.closest('.zh-char');
            selectionPopup.style.left = `${e.pageX + 10}px`;
            selectionPopup.style.top = `${e.pageY + 10}px`;
            currentPopupNodes = [node];
            
            expandLeftBtn.style.display = 'inline-block';
            expandRightBtn.style.display = 'inline-block';
            updatePopupFromNodes();
            
            selectionPopup.classList.remove('hidden');
            popupVi.focus();
        } else {
            hidePopup();
        }
    });

    popupZh.addEventListener('input', () => {
        updatePopupFields(popupZh.value.trim());
    });

    popupSaveBtn.addEventListener('click', () => {
        addGlossaryTerm(popupZh.value.trim(), popupVi.value.trim());
        hidePopup();
        if(sourceText.innerText.trim()) translateBtn.click();
    });

    popupVi.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') popupSaveBtn.click();
    });
}
