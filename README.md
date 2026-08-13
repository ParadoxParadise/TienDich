<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/language.svg" width="100" height="100" alt="Tiên Dịch Logo">
  
  # Tiên Dịch (Web Translator)
  
  **Tiên Dịch** là một ứng dụng dịch thuật truyện chữ Trung Quốc chuyên nghiệp, kết hợp giữa sức mạnh của từ điển VietPhrase truyền thống và công nghệ Trí Tuệ Nhân Tạo (AI) hiện đại.
  
  Hệ thống được thiết kế tối ưu với giao diện trực quan, hỗ trợ dịch tự động toàn bộ chương truyện từ web hoặc văn bản thô.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with JS & Python](https://img.shields.io/badge/Made_with-JS_%26_Python-f7df1e.svg?style=flat)]()
</div>

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Cào Truyện Thông Minh:** Chỉ cần dán link truyện (uukanshu, 69shuba, truyenfull, fanqie, v.v.), ứng dụng tự động bóc tách nội dung chương bỏ qua quảng cáo, với điều hướng chương trước/sau tiện lợi.
- 🧠 **Bộ Não Dịch Thuật Đa Tầng:**
  1. **VietPhrase Engine:** Dịch thô siêu tốc với 7 lớp từ điển (Luật Nhân, Names, Pronouns, Vietphrase, HanViet...). Hỗ trợ popup tra cứu chéo (Thiều Chửu, Lạc Việt).
  2. **AI & Cloud Engines:** Tích hợp đa dạng nguồn dịch mượt:
     - **AI/LLMs:** Google Gemini (1.5, 2.0, 2.5), OpenAI ChatGPT, Claude, DeepSeek, và cả Local AI (Sakura LLM, Ollama).
     - **Miễn Phí:** Google Translate, Microsoft Bing, Youdao, MyMemory.
     - **Trả Phí/Token:** Baidu, Caiyun, DeepL.
- ⚡ **Chunking & Streaming:** Hiển thị kết quả dịch theo thời gian thực (streaming) với các mô hình AI. Hỗ trợ chia nhỏ văn bản tự động để vượt qua giới hạn độ dài của các API miễn phí.
- 🎨 **Giao Diện Trực Quan:** Thiết kế **Dark Mode / Light Mode** sang trọng. Đồng bộ hóa thanh cuộn và highlight giữa bản Gốc - VietPhrase - AI.
- 🛠️ **Quản Lý Từ Điển Tiện Dụng:** Bôi đen thêm tên nhanh (`Ctrl + E`), lưu lịch sử đọc, và quản lý kho từ điển cá nhân đồng bộ thời gian thực.
- 📥 **Xuất File:** Dễ dàng xuất kết quả dịch ra file TXT để lưu trữ hoặc đọc trên các thiết bị khác.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Yêu Cầu Hệ Thống
- Máy tính cài đặt sẵn **Python 3.8** trở lên.

### 2. Khởi Động (Windows)
1. Tải hoặc Clone toàn bộ source code này về máy.
2. Click đúp vào file `run_web.bat`.
3. Hệ thống sẽ tự động cài đặt các thư viện cần thiết (Flask, BeautifulSoup...) và mở trình duyệt tại địa chỉ `http://localhost:8000`.

*Lưu ý: Không nên mở trực tiếp file `index.html` bằng trình duyệt để tránh bị lỗi bảo mật CORS khi gọi API ngoài và đọc file từ điển cục bộ.*

---

## 📂 Cấu Trúc Thư Mục

```
TienDich/
├── server.py         # Flask Backend Proxy (bypass CORS, cào truyện)
├── run_web.bat       # Script khởi động tự động trên Windows
├── index.html        # Giao diện chính của ứng dụng
├── css/              # Giao diện (.css)
├── js/               # Mã nguồn Frontend (Engine, Scraper, Translator, UI)
└── data/             # Nơi chứa kho tàng từ điển VietPhrase
```

---

## 📝 Quản Lý Từ Điển

Hệ thống cho phép bạn tùy ý nâng cấp bộ từ điển bằng cách tải lên các file từ điển chuẩn và thay thế vào thư mục `data/`. Hệ thống sẽ tự động nhận diện và cập nhật!

Nếu bạn có từ điển cá nhân, bạn có thể nạp trực tiếp danh sách từ của mình thông qua tab **Cài đặt** ngay trong ứng dụng, hoặc dùng popup để bôi đen - thêm mới.

---
*Chúc bạn có những giờ phút đọc truyện và dịch truyện tuyệt vời!* 🍵
