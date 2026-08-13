export default {
    async fetchGeneric(url) {
        let html = '';
        try {
            // 1. Thử fetch trực tiếp trước (nếu người dùng cài extension Allow CORS)
            const resDirect = await fetch(url);
            if (!resDirect.ok) throw new Error();
            html = await resDirect.text();
        } catch (e) {
            // 2. Fallback sang Proxy nếu lỗi CORS
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            try {
                const response = await fetch(proxyUrl + encodeURIComponent(url));
                if (!response.ok) throw new Error();
                const data = await response.json();
                html = data.contents;
            } catch (proxyError) {
                throw new Error('Trang truyện bị chặn bảo mật (Cloudflare). Hãy cài tiện ích "Allow CORS: Access-Control-Allow-Origin" trên trình duyệt, bật nó lên và thử lại!');
            }
        }
        
        if (!html) throw new Error('Không lấy được dữ liệu HTML.');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Danh sách các selector phổ biến
        const selectors = [
            'div.muye-reader-content', // Fanqie
            'div.txtnav', // 69shuba
            'div#contentbox', // UUKanshu
            'div#content', // Piaotian, Biquge, v.v.
            'div#chaptercontent',
            'div.Readarea',
            'div#BookText',
            'div#chapter_content',
            'div.content'
        ];

        let contentContainer = null;
        for (let selector of selectors) {
            contentContainer = doc.querySelector(selector);
            if (contentContainer) break;
        }

        // Vét cạn tìm div chứa nhiều chữ nhất
        if (!contentContainer) {
            const divs = Array.from(doc.querySelectorAll('div, article, section'));
            let maxLength = 0;
            for (let div of divs) {
                const clone = div.cloneNode(true);
                clone.querySelectorAll('script, style, iframe, a').forEach(el => el.remove());
                const textLen = clone.textContent.trim().length;
                if (textLen > maxLength) {
                    maxLength = textLen;
                    contentContainer = clone;
                }
            }
        }

        if (contentContainer) {
            // Xóa các thẻ rác
            contentContainer.querySelectorAll('h1, .txtinfo, #txtright, center, script, style, a, .ad, .bottom-ad, #footer').forEach(el => el.remove());
            
            // Trích xuất text an toàn cho DOMParser (không dùng innerText vì không có CSS)
            function extractText(node) {
                let text = '';
                for (let child of node.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        text += child.textContent;
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const tag = child.tagName.toUpperCase();
                        if (tag === 'BR') {
                            text += '\n';
                        } else if (tag === 'P' || tag === 'DIV') {
                            text += '\n' + extractText(child) + '\n';
                        } else {
                            text += extractText(child);
                        }
                    }
                }
                return text;
            }

            let text = extractText(contentContainer);
            // Chuẩn hóa khoảng trắng và dòng
            text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
            return text;
        }

        throw new Error('Không tìm thấy nội dung truyện trong trang này. Thuật toán cào đã bó tay!');
    },

    // Hàm alias tương thích code cũ
    async fetchFanqie(url) {
        return this.fetchGeneric(url);
    }
};
