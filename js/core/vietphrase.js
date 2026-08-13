import LuatNhan from './luatnhan.js';

export default {
    dictionary: new Map(),
    names: new Map(),
    names2Dict: new Map(),
    pronounsDict: new Map(),
    hanVietDict: new Map(),
    phienAmDict: new Map(),
    thieuChuuDict: new Map(),
    lacVietDict: new Map(),
    babylonDict: new Map(),
    luatNhan: LuatNhan,
    isLoaded: false,
    maxWordLength: 15, // Dài nhất của cụm từ trong Vietphrase thường tầm 15 ký tự

    async init() {
        try {
            const vpStatus = document.getElementById('vp-status');
            if (vpStatus) {
                vpStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải Vietphrase (36MB)...';
                vpStatus.className = 'status-badge loading';
            }

            // Tải Names trước vì nó nhỏ
            await this.loadDict('data/Names.txt', this.names);
            
            if (vpStatus) {
                vpStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang giải mã...';
            }

            // Tải Vietphrase
            await this.loadDict('data/Vietphrase.txt', this.dictionary);

            // Tải tất cả từ điển phụ song song (không chặn nếu 1 file lỗi)
            try {
                const fetches = [
                    fetch('data/HanViet.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/Names2.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/Pronouns.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/ChinesePhienAmWords.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/ThieuChuu.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/LacViet.txt').then(r => r.text()).catch(() => ""),
                    fetch('data/Babylon.txt').then(r => r.text()).catch(() => "")
                ];
                const [hvText, names2Text, pronounsText, phienAmText, thieuChuuText, lacVietText, babylonText] = await Promise.all(fetches);
                
                if (hvText) await this.loadDictData(hvText, this.hanVietDict);
                if (names2Text) await this.loadDictData(names2Text, this.names2Dict);
                if (pronounsText) await this.loadDictData(pronounsText, this.pronounsDict);
                if (phienAmText) await this.loadDictData(phienAmText, this.phienAmDict);
                if (thieuChuuText) await this.loadDictData(thieuChuuText, this.thieuChuuDict);
                if (lacVietText) await this.loadDictData(lacVietText, this.lacVietDict);
                if (babylonText) await this.loadDictData(babylonText, this.babylonDict);

                console.log(`Từ điển phụ: HV=${this.hanVietDict.size}, Names2=${this.names2Dict.size}, Pronouns=${this.pronounsDict.size}, PhienAm=${this.phienAmDict.size}, ThieuChuu=${this.thieuChuuDict.size}, LacViet=${this.lacVietDict.size}, Babylon=${this.babylonDict.size}`);
            } catch (e) {
                console.warn("Lỗi tải một số từ điển phụ.", e);
            }

            // Tải Luật Nhân
            await this.luatNhan.init();
            
            this.isLoaded = true;
            console.log("Đã tải xong từ điển VietPhrase!");
            
            if (vpStatus) {
                vpStatus.innerHTML = '<i class="fa-solid fa-check"></i> Từ điển đã sẵn sàng';
                vpStatus.className = 'status-badge success';
                // Ẩn đi sau 3 giây
                setTimeout(() => vpStatus.style.display = 'none', 3000);
            }
        } catch (error) {
            alert(`Lỗi tải từ điển. Nếu bạn đang mở bằng file://, trình duyệt sẽ chặn file cục bộ. Vui lòng chạy file run_web.bat để khởi động đúng cách!`);
            console.error("Lỗi khi tải từ điển:", error);
            const vpStatus = document.getElementById('vp-status');
            if (vpStatus) {
                vpStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Lỗi tải từ điển';
                vpStatus.className = 'status-badge error';
            }
        }
    },

    async loadDict(filepath, targetMap) {
        // Thêm tham số t để phá cache của trình duyệt khi file từ điển bị sửa
        const timestamp = new Date().getTime();
        const response = await fetch(`${filepath}?t=${timestamp}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Không thể tải ${filepath}`);
        const text = await response.text();
        await this.loadDictData(text, targetMap);
    },

    async loadDictData(text, targetMap) {
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            // Format: Trung=Việt hoặc Trung=Việt1/Việt2
            const eqIndex = line.indexOf('=');
            if (eqIndex > 0) {
                const zh = line.substring(0, eqIndex);
                let viRaw = line.substring(eqIndex + 1);
                
                // Chỉ lấy nghĩa đầu tiên trước dấu '/' để cho dễ đọc
                let vi = viRaw.split('/')[0].trim();
                
                if (zh && vi) {
                    targetMap.set(zh, vi);
                    if (zh.length > this.maxWordLength) {
                        this.maxWordLength = zh.length;
                    }
                }
            }
        }
    },

    // Thuật toán Max-Match Tokenization (Giống 100% Quick Translator C#)
    translate(text, userGlossary = []) {
        if (!this.isLoaded) return "Từ điển chưa được tải xong, vui lòng chờ...";
        
        // Chuyển User Glossary thành Map tạm để ưu tiên cao nhất
        const customDict = new Map();
        userGlossary.forEach(g => {
            if (g.zh && g.vi) customDict.set(g.zh, g.vi);
        });

        // Gộp Names + Pronouns cho LuậtNhân
        const allNamesDict = new Map([...this.names, ...this.names2Dict, ...this.pronounsDict, ...customDict]);

        let result = "";
        let i = 0;
        const len = text.length;
        let isStartOfSentence = true; // Để viết hoa chữ đầu câu

        const sentenceEndPunctuation = new Set(['。', '！', '？', '\u201d', '\n', '.', '!', '?', '"']);

        while (i < len) {
            let matched = false;
            // Thử từ độ dài lớn nhất lùi dần về 1
            let maxLen = Math.min(this.maxWordLength, len - i);
            
            for (let chunkLen = maxLen; chunkLen > 0; chunkLen--) {
                const word = text.substring(i, i + chunkLen);
                
                let trans = null;
                let isName = false;

                // Ưu tiên 0: Luật Nhân (pattern matching)
                if (chunkLen > 1 && this.luatNhan.isLoaded) {
                    const luatNhanResult = this.luatNhan.applyRules(word, allNamesDict, this.dictionary);
                    if (luatNhanResult) {
                        trans = luatNhanResult;
                    }
                }

                // Ưu tiên 1: User Glossary
                if (!trans && customDict.has(word)) {
                    trans = customDict.get(word);
                    isName = true;
                }
                // Ưu tiên 2: Names.txt
                else if (!trans && this.names.has(word)) {
                    trans = this.names.get(word);
                    isName = true;
                }
                // Ưu tiên 3: Names2.txt
                else if (!trans && this.names2Dict.has(word)) {
                    trans = this.names2Dict.get(word);
                    isName = true;
                }
                // Ưu tiên 4: Pronouns.txt
                else if (!trans && this.pronounsDict.has(word)) {
                    trans = this.pronounsDict.get(word);
                }
                // Ưu tiên 5: Vietphrase.txt
                else if (!trans && this.dictionary.has(word)) {
                    trans = this.dictionary.get(word);
                }
                // Ưu tiên 6: HanViet.txt
                else if (!trans && this.hanVietDict.has(word)) {
                    trans = this.hanVietDict.get(word);
                }

                if (trans) {
                    // Xử lý viết hoa
                    if (isName) {
                        // Tên riêng: Viết hoa chữ cái đầu của mỗi âm tiết (Ví dụ: hàn lập -> Hàn Lập)
                        trans = trans.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    } else if (isStartOfSentence) {
                        // Viết hoa chữ đầu câu
                        trans = trans.charAt(0).toUpperCase() + trans.slice(1);
                    }

                    result += `<span class="vp-word" data-zh="${word}" data-start="${i}" data-end="${i + chunkLen}">${trans}</span> `;
                    i += chunkLen;
                    matched = true;
                    isStartOfSentence = false;
                    break;
                }
            }

            // Nếu không khớp bất kỳ từ nào (từ đơn hoặc dấu câu)
            if (!matched) {
                const char = text[i];
                
                // Kiểm tra dấu câu để reset cờ viết hoa
                if (sentenceEndPunctuation.has(char)) {
                    isStartOfSentence = true;
                }

                // Nếu là dấu câu, xuống dòng thì không thêm khoảng trắng
                if (char === '\n' || char === '\r') {
                    result += char;
                } else if (/[^\u4e00-\u9fa5]/.test(char)) {
                    // Không phải chữ Hán (thường là dấu câu, số)
                    result = result.trimEnd() + char;
                } else {
                    result += `<span class="vp-word" data-zh="${char}" data-start="${i}" data-end="${i + 1}">${char}</span> `;
                    isStartOfSentence = false;
                }
                i++;
            }
        }

        // Cleanup khoảng trắng thừa trước dấu câu
        return result.replace(/ \./g, '.').replace(/ \,/g, ',').replace(/ \!/g, '!').replace(/ \?/g, '?').replace(/ \n/g, '\n').replace(/  +/g, ' ').trim();
    },

    /**
     * Lấy âm Hán Việt (tách từng chữ) - dùng cho popup
     */
    getHanViet(zhText) {
        let hv = "";
        for (const char of zhText) {
            if (/[^\u4e00-\u9fa5]/.test(char)) {
                hv += char;
            } else {
                const trans = this.phienAmDict.get(char) || this.hanVietDict.get(char) || this.dictionary.get(char);
                if (trans) {
                    hv += trans.split('/')[0].trim() + " ";
                } else {
                    hv += char + " ";
                }
            }
        }
        return hv.trim().replace(/  +/g, ' ');
    },

    /**
     * Lấy nghĩa Thiều Chửu - dùng cho popup
     */
    getThieuChuu(zhText) {
        return this.thieuChuuDict.get(zhText) || "";
    },

    /**
     * Lấy nghĩa Lạc Việt - dùng cho popup  
     */
    getLacViet(zhText) {
        return this.lacVietDict.get(zhText) || "";
    },

    /**
     * Lấy nghĩa Babylon (Anh) - dùng cho popup
     */
    getBabylon(zhText) {
        return this.babylonDict.get(zhText) || "";
    }
};
