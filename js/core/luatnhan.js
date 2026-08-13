/**
 * LuatNhan Engine - Port từ QuickTranslator C#
 * Xử lý luật nhân dạng: 在{n}面前=trước mặt {n}
 * Trong đó {n} = tên riêng (Names), {s} = số/cụm từ, {0} = biến chung
 */
export default {
    rules: [],
    isLoaded: false,

    async init() {
        try {
            const response = await fetch('data/LuatNhan.txt');
            if (!response.ok) {
                console.warn("Không tìm thấy LuatNhan.txt");
                return;
            }
            const text = await response.text();
            const lines = text.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.includes('=')) continue;

                const eqIndex = trimmed.indexOf('=');
                const pattern = trimmed.substring(0, eqIndex);
                const replacement = trimmed.substring(eqIndex + 1);

                if (!pattern || !replacement) continue;

                // Parse pattern thành regex
                // {n} = tên riêng (tra trong Names/Pronouns), {s} = số/cụm
                // {0} = biến tổng quát (bất kỳ chuỗi chữ Hán nào)
                // [abc] = character class (giữ nguyên)
                // (a|b) = alternation (giữ nguyên)

                let regexStr = pattern;
                const captures = []; // Lưu loại capture: 'n', 's', '0', 'num'

                // Đếm số nhóm bắt (captured groups) trong pattern gốc
                // Phân tích từng {n}, {s}, {0}, {1}, {2}...
                let captureIndex = 0;

                // Thay {n} -> capture group cho tên riêng
                regexStr = regexStr.replace(/\{n\}/g, () => {
                    captures.push('n');
                    captureIndex++;
                    return '([^,\\\\. \\?]{1,10})';
                });

                // Thay {s} -> capture group cho cụm từ
                regexStr = regexStr.replace(/\{s\}/g, () => {
                    captures.push('s');
                    captureIndex++;
                    return '([^,\\\\. \\?]{1,10})';
                });

                // Thay {0} -> capture group tổng quát  
                regexStr = regexStr.replace(/\{0\}/g, () => {
                    captures.push('0');
                    captureIndex++;
                    return '([^,\\\\. \\?]{1,10})';
                });

                // Thay {1}, {2}, {3}... -> back-reference hoặc capture
                regexStr = regexStr.replace(/\{(\d+)\}/g, (match, num) => {
                    captures.push('num' + num);
                    captureIndex++;
                    return '([^,\\\\. \\?]{1,10})';
                });

                try {
                    const regex = new RegExp(regexStr);
                    this.rules.push({
                        pattern: pattern,
                        regex: regex,
                        replacement: replacement,
                        captures: captures
                    });
                } catch (e) {
                    // Skip invalid regex patterns
                }
            }

            this.isLoaded = true;
            console.log(`Đã tải ${this.rules.length} luật nhân.`);
        } catch (error) {
            console.warn("Lỗi tải LuatNhan:", error);
        }
    },

    /**
     * Áp dụng luật nhân lên một đoạn text tiếng Trung.
     * @param {string} chinese - Đoạn text gốc tiếng Trung
     * @param {Map} namesDict - Từ điển tên riêng (Names + Pronouns)
     * @param {Map} vpDict - Từ điển VietPhrase
     * @returns {string|null} Kết quả dịch nếu khớp luật nhân, null nếu không khớp
     */
    applyRules(chinese, namesDict, vpDict) {
        if (!this.isLoaded || !chinese) return null;

        for (const rule of this.rules) {
            const fullRegex = new RegExp('^' + rule.regex.source + '$');
            const match = chinese.match(fullRegex);

            if (!match) continue;

            // Kiểm tra xem các capture group có nằm trong từ điển không
            let allValid = true;
            const capturedValues = [];

            for (let i = 0; i < rule.captures.length; i++) {
                const captured = match[i + 1];
                if (!captured) { allValid = false; break; }

                const type = rule.captures[i];
                if (type === 'n') {
                    // {n} phải là tên riêng
                    if (namesDict && (namesDict.has(captured))) {
                        capturedValues.push(namesDict.get(captured));
                    } else if (vpDict && vpDict.has(captured)) {
                        capturedValues.push(vpDict.get(captured));
                    } else {
                        allValid = false; break;
                    }
                } else if (type === 's' || type === '0') {
                    // {s}/{0} tra trong bất kỳ từ điển nào
                    if (vpDict && vpDict.has(captured)) {
                        capturedValues.push(vpDict.get(captured));
                    } else if (namesDict && namesDict.has(captured)) {
                        capturedValues.push(namesDict.get(captured));
                    } else {
                        allValid = false; break;
                    }
                } else {
                    // {1}, {2}... tra trong từ điển
                    if (vpDict && vpDict.has(captured)) {
                        capturedValues.push(vpDict.get(captured));
                    } else if (namesDict && namesDict.has(captured)) {
                        capturedValues.push(namesDict.get(captured));
                    } else {
                        allValid = false; break;
                    }
                }
            }

            if (!allValid) continue;

            // Tạo kết quả bằng cách thay thế {n}, {s}, {0}, {1}... trong replacement
            let result = rule.replacement;
            let capIdx = 0;

            result = result.replace(/\{(?:n|s|0|\d+)\}/g, () => {
                const val = capturedValues[capIdx] || '';
                capIdx++;
                // Lấy nghĩa đầu tiên
                return val.split('/')[0].trim();
            });

            return result;
        }

        return null;
    }
};
