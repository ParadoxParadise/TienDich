/**
 * scraper.js - Tiên Dịch Chapter Fetcher
 * Gọi Python backend /api/fetch để lấy nội dung chương từ URL bất kỳ.
 * Có fallback sang allorigins nếu backend chưa chạy.
 */

const LOCAL_API = 'http://localhost:8000/api/fetch';
const TRANSLATE_API = 'http://localhost:8000/api/translate';

export default {
    _lastNav: {},

    async fetchGeneric(url) {
        // 1. Thử gọi Python backend (chạy qua run_web.bat)
        try {
            const resp = await fetch(LOCAL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                signal: AbortSignal.timeout(20000)
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.error) throw new Error(data.error);
                this._lastNav = data.nav || {};
                return data.text;
            }
        } catch (e) {
            if (e.name !== 'TypeError' && e.name !== 'AbortError') {
                // Backend trả lỗi thực sự
                throw new Error(e.message || 'Lỗi khi tải trang');
            }
            // TypeError = backend chưa chạy, fallback sang browser-only
        }

        // 2. Fallback: thử fetch trực tiếp (nếu có extension Allow CORS)
        let html = '';
        try {
            const resDirect = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (!resDirect.ok) throw new Error();
            html = await resDirect.text();
        } catch (e) {
            // 3. Fallback: allorigins proxy
            try {
                const proxyUrl = 'https://api.allorigins.win/get?url=';
                const response = await fetch(proxyUrl + encodeURIComponent(url), { signal: AbortSignal.timeout(15000) });
                if (!response.ok) throw new Error();
                const data = await response.json();
                html = data.contents;
            } catch (proxyError) {
                throw new Error(
                    '⚠️ Không tải được trang!\n\n' +
                    'Để tải truyện hoạt động tốt nhất, bạn nên chạy web qua file run_web.bat thay vì mở file HTML trực tiếp.\n\n' +
                    'Hoặc cài tiện ích "Allow CORS: Access-Control-Allow-Origin" trên Chrome và bật lên.'
                );
            }
        }

        if (!html) throw new Error('Không lấy được dữ liệu HTML.');
        return this._extractFromHtml(html, url);
    },

    _extractFromHtml(html, baseUrl = '') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Xóa rác
        doc.querySelectorAll('script, style, nav, footer, header, iframe, noscript').forEach(el => el.remove());

        const selectors = [
            'div.muye-reader-content',
            'div.txtnav',
            'div#contentbox',
            'div#chapter-c',
            'div#content',
            'div#chaptercontent',
            'div.Readarea',
            'div#BookText',
            'div#chapter_content',
            'article.chapter',
            'div.content'
        ];

        let contentContainer = null;
        for (const selector of selectors) {
            const el = doc.querySelector(selector);
            if (el && el.textContent.trim().length > 200) {
                contentContainer = el;
                break;
            }
        }

        // Prose Density fallback (browser version)
        if (!contentContainer) {
            const candidates = Array.from(doc.querySelectorAll('div, article, section, main'));
            let maxScore = 0;
            for (const el of candidates) {
                const classes = (el.className || '').toString();
                if (/nav|menu|sidebar|header|footer|widget/i.test(classes)) continue;
                const text = el.textContent || '';
                if (text.length < 400) continue;
                const linkText = Array.from(el.querySelectorAll('a')).reduce((s, a) => s + (a.textContent || '').length, 0);
                const density = linkText / Math.max(text.length, 1);
                if (density > 0.35) continue;
                const pCount = el.querySelectorAll(':scope > p').length;
                const score = text.length * (1 - density) * (1 + 0.15 * Math.min(pCount, 20));
                if (score > maxScore) { maxScore = score; contentContainer = el; }
            }
        }

        if (!contentContainer) {
            throw new Error('Không tìm thấy nội dung truyện trong trang này.');
        }

        // Detect nav links
        this._lastNav = {};
        doc.querySelectorAll('a[href]').forEach(a => {
            const text = a.textContent.trim();
            const href = a.getAttribute('href');
            if (!href || href.startsWith('javascript')) return;
            const fullUrl = new URL(href, baseUrl).href;
            if (/上一章|上一页|prev|chương.trước/i.test(text)) this._lastNav.prev = fullUrl;
            if (/下一章|下一页|next|chương.sau/i.test(text)) this._lastNav.next = fullUrl;
        });

        // Xóa rác trong container
        contentContainer.querySelectorAll('h1, .txtinfo, #txtright, center, .ad, .bottom-ad, #footer, .notice').forEach(el => el.remove());

        function extractText(node) {
            let text = '';
            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    text += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toUpperCase();
                    if (tag === 'BR') text += '\n';
                    else if (tag === 'P' || tag === 'DIV') text += '\n' + extractText(child) + '\n';
                    else text += extractText(child);
                }
            }
            return text;
        }

        let text = extractText(contentContainer);
        text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
        return text;
    },

    getLastNav() {
        return this._lastNav || {};
    },

    // Proxy dịch qua backend (cho Bing, Youdao, Baidu)
    async translateViaBackend(engine, text, apiKey = '') {
        try {
            const resp = await fetch(`${TRANSLATE_API}/${engine}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, apiKey }),
                signal: AbortSignal.timeout(30000)
            });
            
            // Xử lý nếu backend không chạy (trả về HTML 404 của live-server/http.server)
            const contentType = resp.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                throw new Error("Lỗi: Không tìm thấy Backend. Vui lòng chạy ứng dụng thông qua file run_web.bat để sử dụng tính năng này!");
            }

            const data = await resp.json();
            if (!resp.ok || data.error) throw new Error(data.error || 'Lỗi dịch thuật qua backend');
            return data.result;
        } catch (e) {
            if (e.name === 'SyntaxError' || e.message.includes('JSON')) {
                throw new Error("Vui lòng chạy ứng dụng thông qua file run_web.bat để sử dụng tính năng này!");
            }
            throw e;
        }
    },

    async fetchFanqie(url) {
        return this.fetchGeneric(url);
    }
};
