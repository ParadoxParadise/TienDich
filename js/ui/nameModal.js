export function initNameModal(addGlossaryTerm) {
    const openBtn = document.getElementById('open-name-modal-btn');
    const nameModal = document.getElementById('name-modal');
    const closeBtn = document.getElementById('close-name-modal');
    
    const popupZh = document.getElementById('popup-zh');
    const popupVi = document.getElementById('popup-vi');
    const popupHv = document.getElementById('popup-hv');
    // Note: Some elements like name-en or popup-tc might not exist depending on the HTML

    const nameZh = document.getElementById('name-zh');
    const nameHv = document.getElementById('name-hv');
    const nameEn = document.getElementById('name-en');
    const nameVp = document.getElementById('name-vp');
    const nameKho = document.getElementById('name-kho');
    const nameVi = document.getElementById('name-vi');

    // Mở Modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            nameModal.classList.remove('hidden');
            document.getElementById('selection-popup').classList.add('hidden');
            
            // Prefill data
            if (nameZh && popupZh) nameZh.value = popupZh.value;
            if (nameVp && popupVi) nameVp.value = popupVi.value;
            if (nameHv && popupHv) nameHv.value = popupHv.value;
            if (nameVi) nameVi.value = '';
        });
    }

    // Đóng Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            nameModal.classList.add('hidden');
        });
    }

    async function updateNameModalFields(zhText) {
        if (!zhText) {
            if (nameVp) nameVp.value = "";
            if (nameHv) nameHv.value = "";
            return;
        }
        
        // VietPhrase
        if (window.VietPhrase) {
            const vpMeaning = window.VietPhrase.translate(zhText, []);
            if (nameVp) nameVp.value = vpMeaning.replace(/<[^>]*>?/gm, '');
        }

        // Hán Việt xịn (dùng helper method tập trung)
        let hvResult = "";
        if (window.VietPhrase && window.VietPhrase.getHanViet) {
            hvResult = window.VietPhrase.getHanViet(zhText);
        }
        
        if (nameHv) nameHv.value = hvResult;

        // Tiếng Anh (Google Translate)
        if (nameEn) {
            nameEn.value = "Đang dịch...";
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(zhText)}`;
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        const translated = data[0]?.map(item => item[0] || '').join('') || '';
                        nameEn.value = translated;
                    })
                    .catch(() => nameEn.value = "Lỗi mạng");
            } catch (e) {
                nameEn.value = "Lỗi";
            }
        }
    }

    if (nameZh) {
        nameZh.addEventListener('input', () => {
            updateNameModalFields(nameZh.value.trim());
        });
    }

    // Các nút Dùng (copy vào kết quả Tiếng Việt)
    document.getElementById('nt-dung')?.addEventListener('click', () => { if(nameHv) nameVi.value = nameHv.value; });
    document.getElementById('nt-dung-en')?.addEventListener('click', () => { if(nameEn) nameVi.value = nameEn.value; });
    document.getElementById('nt-dung-vp')?.addEventListener('click', () => { if(nameVp) nameVi.value = nameVp.value; });
    document.getElementById('nt-dung-kho')?.addEventListener('click', () => { if(nameKho) nameVi.value = nameKho.value; });

    // Các nút format Hán Việt
    document.getElementById('nt-hoa1')?.addEventListener('click', () => {
        if (!nameHv) return;
        let val = nameHv.value.toLowerCase();
        nameVi.value = val.charAt(0).toUpperCase() + val.slice(1);
    });
    
    document.getElementById('nt-hoa2')?.addEventListener('click', () => {
        if (!nameHv) return;
        let words = nameHv.value.toLowerCase().split(' ');
        nameVi.value = words.map((w, i) => i < 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
    });

    document.getElementById('nt-thuong')?.addEventListener('click', () => {
        if (!nameHv) return;
        let words = nameHv.value.toLowerCase().split(' ');
        if (words.length > 0) {
            words[words.length - 1] = words[words.length - 1].toLowerCase(); // Just keep it lowercase
        }
        // Capitalize the rest? Usually it means capitalize first words and lower the last.
        nameVi.value = words.map((w, i) => i < words.length - 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase()).join(' ');
    });

    document.getElementById('nt-hoaall')?.addEventListener('click', () => {
        if (!nameHv) return;
        let words = nameHv.value.toLowerCase().split(' ');
        nameVi.value = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    });

    // Nút Lưu
    document.getElementById('btn-save-name-en')?.addEventListener('click', () => {
        if (nameZh.value && nameVi.value) {
            addGlossaryTerm(nameZh.value, nameVi.value);
            nameModal.classList.add('hidden');
        } else {
            alert("Vui lòng điền đủ Tiếng Trung và Kết quả (Tiếng Việt)!");
        }
    });

    document.getElementById('btn-save-name-hv')?.addEventListener('click', () => {
        if (nameZh.value && nameVi.value) {
            addGlossaryTerm(nameZh.value, nameVi.value);
            nameModal.classList.add('hidden');
        } else {
            alert("Vui lòng điền đủ Tiếng Trung và Kết quả (Tiếng Việt)!");
        }
    });
}
