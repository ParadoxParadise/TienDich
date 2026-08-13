"""
server.py - Tiên Dịch Backend Server
Thay thế 'python -m http.server' với Flask server đầy đủ tính năng:
- Serve static files (HTML, CSS, JS, data/)
- /api/fetch  : Lấy nội dung chương từ URL bất kỳ (Prose Density algorithm)
- /api/chapter-nav : Phát hiện link chương trước/sau
- /api/translate/google : Google Translate (free, không cần key)
- /api/translate/bing   : Microsoft Bing Translate (free)
- /api/translate/youdao : Youdao (free)
- /api/translate/baidu  : Baidu API (cần key)
"""

import os
import re
import sys
import time
import json
import hashlib
import random
import string
import logging
import urllib.parse
import urllib.request
from threading import Thread

# ---------- Flask ----------
try:
    from flask import Flask, request, jsonify, send_from_directory, Response
    from flask_cors import CORS
except ImportError:
    print("Đang cài Flask... vui lòng chờ giây lát")
    os.system(f"{sys.executable} -m pip install flask flask-cors requests beautifulsoup4 -q")
    from flask import Flask, request, jsonify, send_from_directory, Response
    from flask_cors import CORS

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    os.system(f"{sys.executable} -m pip install requests beautifulsoup4 -q")
    import requests
    from bs4 import BeautifulSoup

# ---------- App Setup ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)
logging.getLogger('werkzeug').setLevel(logging.WARNING)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# ---------- Static File Serving ----------
@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)

# ============================================================
# API: /api/fetch — Fetch chapter content from any URL
# ============================================================
def prose_density_score(el):
    """Thuật toán Prose Density (từ lightnovel-crawler) để tìm vùng nội dung chính."""
    text = el.get_text(separator=' ', strip=True)
    if len(text) < 400:
        return 0
    links = el.find_all('a')
    link_text_len = sum(len(a.get_text(strip=True)) for a in links)
    density = link_text_len / max(len(text), 1)
    if density > 0.35:
        return 0
    p_count = len(el.find_all('p', recursive=False))
    score = len(text) * (1 - density) * (1 + 0.15 * min(p_count, 20))
    return score

SITE_SELECTORS = {
    'uukanshu.com':   ['div#contentbox', 'div.bookContent'],
    '69shuba.com':    ['div.txtnav', 'div#content'],
    '69shuba.cx':     ['div.txtnav', 'div#content'],
    'biqugex.com':    ['div#content'],
    'biquge.com':     ['div#content'],
    'truyenfull.vn':  ['div#chapter-c', 'div.chapter-c'],
    'piaotian.com':   ['div#content'],
    'xbiquge.la':     ['div#content'],
    'shuhaige.net':   ['div#content'],
    'fanqienovel.com':['div.muye-reader-content'],
    'qidian.com':     ['div.read-content', 'div#j_chapterContent'],
}

NAV_SELECTORS = {
    'prev': ['a.prev', 'a[rel="prev"]', 'a:contains("上一章")', 'a:contains("上一页")', 'a:contains("Chương trước")', 'a.chapter-prev'],
    'next': ['a.next', 'a[rel="next"]', 'a:contains("下一章")', 'a:contains("下一页")', 'a:contains("Chương sau")', 'a.chapter-next'],
}

def extract_chapter_text(html, base_url=''):
    soup = BeautifulSoup(html, 'html.parser')

    # Xóa rác
    for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript', 'ins', 'form']):
        tag.decompose()
    for tag in soup.find_all(class_=re.compile(r'(ad|banner|sidebar|comment|social|share|copyright|notice)', re.I)):
        tag.decompose()

    # 1. Thử selector cụ thể theo domain
    domain = urllib.parse.urlparse(base_url).hostname or ''
    for site, selectors in SITE_SELECTORS.items():
        if site in domain:
            for sel in selectors:
                el = soup.select_one(sel)
                if el and len(el.get_text(strip=True)) > 200:
                    return extract_text_from_element(el), get_nav_links(soup, base_url)

    # 2. Fallback: Prose Density algorithm
    candidates = soup.find_all(['div', 'article', 'section', 'main', 'td'])
    best_el = None
    best_score = 0
    for el in candidates:
        # Skip navigation containers
        classes = ' '.join(el.get('class', []))
        if re.search(r'(nav|menu|sidebar|header|footer|widget)', classes, re.I):
            continue
        score = prose_density_score(el)
        if score > best_score:
            best_score = score
            best_el = el

    if best_el and best_score > 1000:
        return extract_text_from_element(best_el), get_nav_links(soup, base_url)

    return None, {}

def extract_text_from_element(el):
    """Trích xuất text, giữ cấu trúc đoạn văn."""
    lines = []
    for node in el.descendants:
        if node.name in ('p', 'div', 'br') and node.name != el.name:
            text = node.get_text(separator='\n', strip=True)
            if text:
                lines.append(text)
        elif node.name is None and node.parent.name not in ('script', 'style'):
            text = str(node).strip()
            if text:
                lines.append(text)

    # Fallback nếu không có thẻ p
    if not lines:
        raw = el.get_text(separator='\n', strip=True)
        lines = raw.split('\n')

    result = '\n'.join(line for line in lines if line.strip())
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()

def get_nav_links(soup, base_url):
    """Phát hiện link chương trước/sau."""
    nav = {}
    # Tìm theo text phổ biến
    for link in soup.find_all('a', href=True):
        text = link.get_text(strip=True)
        href = link['href']
        if not href or href.startswith('javascript'):
            continue
        full_url = urllib.parse.urljoin(base_url, href)
        if re.search(r'(上一章|上一页|prev|previous|chương.trước)', text, re.I):
            nav['prev'] = full_url
        elif re.search(r'(下一章|下一页|next|chương.sau)', text, re.I):
            nav['next'] = full_url
    return nav

@app.route('/api/fetch', methods=['POST'])
def api_fetch():
    data = request.json
    url = data.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL không hợp lệ'}), 400

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        # Detect encoding
        encoding = resp.apparent_encoding or 'utf-8'
        html = resp.content.decode(encoding, errors='replace')

        text, nav = extract_chapter_text(html, url)
        if not text:
            return jsonify({'error': 'Không tìm thấy nội dung chương. Trang này có thể bị chặn hoặc dùng JS để render.'}), 422

        return jsonify({'text': text, 'nav': nav, 'url': url})
    except requests.exceptions.Timeout:
        return jsonify({'error': f'Hết thời gian kết nối tới {url}. Trang có thể chậm hoặc bị block.'}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({'error': f'Không thể kết nối tới {url}. Kiểm tra lại URL hoặc kết nối mạng.'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# API: /api/translate/google — Google Translate Free
# ============================================================
@app.route('/api/translate/google', methods=['POST'])
def translate_google():
    data = request.json
    text = data.get('text', '')
    sl = data.get('sl', 'zh-CN')
    tl = data.get('tl', 'vi')

    MAX_CHUNK = 600
    chunks = []
    buf = ''
    for sent in re.split(r'([。\n！？.!?])', text):
        buf += sent
        if len(buf) >= MAX_CHUNK:
            if buf.strip():
                chunks.append(buf)
            buf = ''
    if buf.strip():
        chunks.append(buf)
    if not chunks:
        chunks = [text]

    results = []
    for chunk in chunks:
        if not chunk.strip():
            results.append(chunk)
            continue
        try:
            url = f'https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={urllib.parse.quote(chunk)}'
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            arr = resp.json()
            translated = ''.join(item[0] for item in arr[0] if item[0])
            results.append(translated)
            time.sleep(0.1)
        except Exception as e:
            results.append(f'[Lỗi: {e}]')

    return jsonify({'result': ''.join(results)})

# ============================================================
# API: /api/translate/bing — Microsoft Bing Free
# ============================================================
_bing_cache = {'token': None, 'ig': '', 'iid': '', 'expires': 0}

def get_bing_token():
    now = time.time()
    if _bing_cache['token'] and now < _bing_cache['expires']:
        return _bing_cache
    try:
        resp = requests.get('https://www.bing.com/translator', headers=HEADERS, timeout=10)
        html = resp.text
        params_match = re.search(r'params_AbusePreventionHelper\s*=\s*(\[.*?\])', html)
        ig_match = re.search(r'"ig":"([^"]+)"', html)
        iid_match = re.search(r'data-iid="([^"]+)"', html)
        if params_match and ig_match:
            params = json.loads(params_match.group(1))
            _bing_cache['token'] = params[1]
            _bing_cache['expires'] = now + int(params[2]) / 1000 - 60
            _bing_cache['ig'] = ig_match.group(1)
            _bing_cache['iid'] = iid_match.group(1) if iid_match else 'translator.5028'
    except Exception as e:
        print(f'Bing token error: {e}')
    return _bing_cache

@app.route('/api/translate/bing', methods=['POST'])
def translate_bing():
    data = request.json
    text = data.get('text', '')
    to_lang = data.get('tl', 'vi')

    cache = get_bing_token()
    if not cache.get('token'):
        return jsonify({'error': 'Không lấy được token Bing'}), 503

    try:
        url = (f"https://www.bing.com/ttranslatev3?isVertical=1&IG={cache['ig']}"
               f"&IID={cache['iid']}")
        resp = requests.post(url, headers={**HEADERS, 'Content-Type': 'application/x-www-form-urlencoded'},
                             data={'&fromLang': 'zh-Hans', 'to': to_lang, 'text': text[:5000],
                                   'token': cache['token'], 'key': int(time.time() * 1000)},
                             timeout=15)
        resp.raise_for_status()
        result = resp.json()
        translated = result[0]['translations'][0]['text']
        return jsonify({'result': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# API: /api/translate/youdao — Youdao Free (web scrape)
# ============================================================
@app.route('/api/translate/youdao', methods=['POST'])
def translate_youdao():
    data = request.json
    text = data.get('text', '')
    try:
        # Youdao free API (không chính thức)
        url = 'https://fanyi.youdao.com/translate_o'
        salt = str(random.randint(10, 99))
        sign_text = 'fanyideskweb' + text + salt + 'Tbh5E8=q6U3EXe+&L[4c@'
        sign = hashlib.md5(sign_text.encode()).hexdigest()
        form_data = {
            'i': text[:5000],
            'from': 'zh-CHS',
            'to': 'vi',
            'smartresult': 'dict',
            'client': 'fanyideskweb',
            'salt': salt,
            'sign': sign,
            'lts': str(int(time.time() * 1000)),
            'bv': hashlib.md5('5.0 (Windows NT 10.0; Win64; x64)'.encode()).hexdigest(),
            'doctype': 'json',
            'version': '2.1',
            'keyfrom': 'fanyi.web',
            'action': 'FY_BY_DEFAULT',
        }
        resp = requests.post(url, data=form_data, headers={
            **HEADERS,
            'Referer': 'https://fanyi.youdao.com/',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'OUTFOX_SEARCH_USER_ID='+str(random.randint(1000000000, 9999999999))+'@8.8.8.8'
        }, timeout=10)
        result = resp.json()
        translated = ''.join(s['tgt'] for s in result.get('translateResult', [[]])[0])
        return jsonify({'result': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# API: /api/translate/baidu — Baidu Fanyi API (cần AppID|AppSecret)
# ============================================================
@app.route('/api/translate/baidu', methods=['POST'])
def translate_baidu():
    data = request.json
    text = data.get('text', '')
    api_key = data.get('apiKey', '')
    parts = api_key.split('|')
    if len(parts) != 2:
        return jsonify({'error': 'Vui lòng nhập API Key Baidu theo định dạng: AppID|AppSecret'}), 400

    app_id, app_secret = parts[0].strip(), parts[1].strip()
    salt = str(random.randint(32768, 65536))
    sign_str = app_id + text + salt + app_secret
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()

    try:
        resp = requests.post('https://fanyi-api.baidu.com/api/trans/vip/translate',
                             data={'q': text, 'from': 'zh', 'to': 'vie', 'appid': app_id, 'salt': salt, 'sign': sign},
                             timeout=10)
        result = resp.json()
        if 'error_code' in result:
            return jsonify({'error': f"Baidu lỗi {result['error_code']}: {result.get('error_msg')}"}), 400
        translated = '\n'.join(r['dst'] for r in result['trans_result'])
        return jsonify({'result': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# API: /api/translate/caiyun — Caiyun AI (cần token)
# ============================================================
@app.route('/api/translate/caiyun', methods=['POST'])
def translate_caiyun():
    data = request.json
    text = data.get('text', '')
    token = data.get('apiKey', '')
    if not token:
        return jsonify({'error': 'Vui lòng nhập Caiyun Token'}), 400
    try:
        resp = requests.post('https://api.interpreter.caiyunai.com/v1/translator',
                             json={'source': text.split('\n'), 'trans_type': 'zh2vi', 'request_id': 'tien-dich', 'detect': True},
                             headers={**HEADERS, 'X-Authorization': f'token {token}', 'Content-Type': 'application/json'},
                             timeout=15)
        result = resp.json()
        return jsonify({'result': '\n'.join(result.get('target', []))})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print("=" * 58)
    print("  🐉 TIÊN DỊCH - BACKEND SERVER ĐANG KHỞI ĐỘNG")
    print("=" * 58)
    print(f"  📡 Địa chỉ : http://localhost:{port}")
    print(f"  📚 API     : http://localhost:{port}/api/fetch")
    print(f"  🌐 Dịch    : http://localhost:{port}/api/translate/google")
    print("=" * 58)

    # Tự động mở trình duyệt sau 1 giây
    def open_browser():
        time.sleep(1.2)
        import webbrowser
        webbrowser.open(f'http://localhost:{port}')
    Thread(target=open_browser, daemon=True).start()

    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
