/**
 * translator.js - Tiên Dịch Translation Engine
 * Hỗ trợ nhiều nguồn dịch: AI/LLM + Free + API
 */

import Scraper from './scraper.js';

const BACKEND = 'http://localhost:8000';

// Chia văn bản thành các đoạn ~2000 ký tự, tôn trọng ranh giới câu/đoạn
function splitIntoChunks(text, maxLen = 2000) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let current = '';

    for (const para of paragraphs) {
        if ((current + '\n\n' + para).length > maxLen && current) {
            chunks.push(current.trim());
            current = para;
        } else {
            current = current ? current + '\n\n' + para : para;
        }
    }
    if (current.trim()) chunks.push(current.trim());

    // Nếu vẫn có chunk quá dài, chia tiếp theo câu
    const result = [];
    for (const chunk of chunks) {
        if (chunk.length <= maxLen) {
            result.push(chunk);
        } else {
            const sentences = chunk.split(/([。！？.!?\n])/);
            let buf = '';
            for (let i = 0; i < sentences.length; i++) {
                buf += sentences[i];
                if (buf.length >= maxLen) {
                    result.push(buf.trim());
                    buf = '';
                }
            }
            if (buf.trim()) result.push(buf.trim());
        }
    }
    return result.filter(c => c.trim());
}

function buildSystemPrompt(glossary) {
    let glossaryContext = '';
    if (glossary && glossary.length > 0) {
        glossaryContext = '\n\nTừ điển tên riêng - PHẢI tuân thủ:\n' + glossary.map(g => `${g.zh} → ${g.vi}`).join('\n');
    }
    return `Bạn là dịch giả tiểu thuyết chuyên nghiệp, chuyên dịch truyện Trung Quốc (tiên hiệp, huyền huyễn, đô thị, ngôn tình) sang Tiếng Việt. 
Yêu cầu:
- Dịch TOÀN BỘ nội dung, không bỏ qua bất kỳ đoạn nào
- Giữ văn phong của tác giả (mạnh mẽ, uy nghiêm với tiên hiệp; ngọt ngào với ngôn tình...)
- Xưng hô: "Ta", "Ngươi", "Hắn/Nàng" (không dùng "tôi", "bạn", "anh/chị" bình thường)
- Giữ nguyên tên địa danh, môn phái nếu đã có trong từ điển
- KHÔNG thêm chú thích hay giải thích thêm vào bản dịch
- Trả về ĐÚNG bản dịch, KHÔNG có lời mở đầu hay kết thúc${glossaryContext}`;
}

export default {
    _abortController: null,

    abort() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    },

    async translate(text, provider, apiKey, glossary, onChunk, baseUrl, onProgress) {
        this._abortController = new AbortController();
        const signal = this._abortController.signal;
        const systemPrompt = buildSystemPrompt(glossary);

        const FREE_PROVIDERS = ['google', 'bing', 'youdao'];
        const BACKEND_PROVIDERS = ['bing', 'youdao', 'baidu', 'caiyun'];
        const CHUNKED_PROVIDERS = ['google', 'bing', 'youdao', 'baidu', 'caiyun', 'deepl'];

        // Providers dùng chunked translation (không phải LLM stream)
        if (CHUNKED_PROVIDERS.includes(provider)) {
            const chunks = splitIntoChunks(text, provider === 'google' ? 600 : 2000);
            for (let i = 0; i < chunks.length; i++) {
                if (signal.aborted) break;
                if (onProgress) onProgress(i + 1, chunks.length);
                let result = '';
                if (BACKEND_PROVIDERS.includes(provider)) {
                    result = await Scraper.translateViaBackend(provider, chunks[i], apiKey);
                } else if (provider === 'google') {
                    result = await this._googleChunk(chunks[i], signal);
                } else if (provider === 'deepl') {
                    result = await this._deepl(chunks[i], apiKey);
                }
                onChunk(result + (i < chunks.length - 1 ? '\n\n' : ''));
            }
            return;
        }

        // LLM providers — chunked với stream
        const chunks = splitIntoChunks(text, 3000);
        for (let i = 0; i < chunks.length; i++) {
            if (signal.aborted) break;
            if (onProgress) onProgress(i + 1, chunks.length);

            switch (provider) {
                case 'openai':
                    await this._openAI(chunks[i], apiKey, systemPrompt, onChunk, 'https://api.openai.com/v1/chat/completions', 'gpt-4o-mini', signal);
                    break;
                case 'deepseek':
                    await this._openAI(chunks[i], apiKey, systemPrompt, onChunk, 'https://api.deepseek.com/chat/completions', 'deepseek-chat', signal);
                    break;
                case 'custom_openai':
                    await this._openAI(chunks[i], apiKey || 'dummy-key', systemPrompt, onChunk, (baseUrl || '').replace(/\/$/, '') + '/chat/completions', '', signal);
                    break;
                case 'claude':
                    await this._claude(chunks[i], apiKey, systemPrompt, onChunk, signal);
                    break;
                case 'gemini':
                    await this._gemini(chunks[i], apiKey, systemPrompt, onChunk, signal, baseUrl);
                    break;
                case 'mymemory':
                    await this._myMemory(chunks[i], onChunk, signal);
                    break;
                default:
                    throw new Error(`Nguồn dịch "${provider}" không được hỗ trợ`);
            }
            // Thêm dòng trắng giữa các chunk
            if (i < chunks.length - 1) onChunk('\n\n');
        }
    },

    async _googleChunk(text, signal) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url, { signal: signal || undefined });
        if (!res.ok) throw new Error(`Lỗi Google Translate (${res.status}). Có thể bạn đang gửi quá nhanh.`);
        const data = await res.json();
        return data[0]?.map(item => item[0] || '').join('') || '';
    },

    // Compat: vẫn hỗ trợ gọi translateGoogle cũ
    async translateGoogle(text, onChunk) {
        const chunks = splitIntoChunks(text, 600);
        for (const chunk of chunks) {
            const result = await this._googleChunk(chunk, null);
            onChunk(result);
        }
    },

    async _openAI(text, apiKey, systemPrompt, onChunk, url, model, signal) {
        const bodyPayload = {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            stream: true,
            temperature: 0.3,
            max_tokens: 8192
        };
        if (model) bodyPayload.model = model;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(bodyPayload),
            signal
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Lỗi OpenAI API (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) onChunk(content);
                } catch {}
            }
        }
    },

    async _claude(text, apiKey, systemPrompt, onChunk, signal) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8192,
                system: systemPrompt,
                messages: [{ role: 'user', content: text }],
                stream: true,
                temperature: 0.3
            }),
            signal
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Lỗi Claude API (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                        onChunk(parsed.delta.text);
                    }
                } catch {}
            }
        }
    },

    async _gemini(text, apiKey, systemPrompt, onChunk, signal, modelOverride) {
        // Hỗ trợ nhiều model Gemini
        const model = modelOverride || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            }),
            signal
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Lỗi Gemini API (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const parsed = JSON.parse(line.slice(6));
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) onChunk(text);
                } catch {}
            }
        }
    },

    async _deepl(text, apiKey) {
        const isFree = apiKey.endsWith(':fx');
        const url = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: [text], source_lang: 'ZH', target_lang: 'EN-US' })
        });
        if (!response.ok) throw new Error('Lỗi DeepL API (DeepL chưa hỗ trợ Tiếng Việt, dịch sang Anh)');
        const data = await response.json();
        return data.translations[0].text + '\n[DeepL: Dịch sang Tiếng Anh vì DeepL chưa hỗ trợ Tiếng Việt]';
    },

    async _myMemory(text, onChunk, signal) {
        const chunks = splitIntoChunks(text, 450);
        for (const chunk of chunks) {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=zh-CN|vi`;
            const res = await fetch(url, { signal });
            if (!res.ok) throw new Error('Lỗi MyMemory API');
            const data = await res.json();
            onChunk(data.responseData.translatedText + '\n');
            await new Promise(r => setTimeout(r, 200));
        }
    },

    // --- Compat với code cũ ---
    async translateOpenAI(text, apiKey, systemPrompt, onChunk, url, model) {
        return this._openAI(text, apiKey, systemPrompt, onChunk, url, model, null);
    },
    async translateClaude(text, apiKey, systemPrompt, onChunk) {
        return this._claude(text, apiKey, systemPrompt, onChunk, null);
    },
    async translateGemini(text, apiKey, systemPrompt, onChunk) {
        return this._gemini(text, apiKey, systemPrompt, onChunk, null);
    },
    async translateDeepL(text, apiKey, onChunk) {
        const r = await this._deepl(text, apiKey);
        onChunk(r);
    },
    async translateMyMemory(text, onChunk) {
        return this._myMemory(text, onChunk, null);
    }
};
