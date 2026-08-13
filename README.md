<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/language.svg" width="100" height="100" alt="Tiên Dịch Logo">
  
  # Tiên Dịch (Web Translator)
  
  **Tiên Dịch** là một ứng dụng dịch thuật truyện chữ Trung Quốc chuyên nghiệp. Công cụ mang đến tốc độ và chất lượng dịch mượt mà thông qua bộ từ điển VietPhrase đồ sộ kết hợp cùng các nền tảng dịch thuật đám mây mạnh mẽ.
  
  Hệ thống được thiết kế tối ưu với giao diện trực quan, hỗ trợ lấy toàn bộ chương truyện từ web hoặc văn bản thô để dịch một cách hoàn toàn tự động.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with JS & Python](https://img.shields.io/badge/Made_with-JS_%26_Python-f7df1e.svg?style=flat)]()
</div>

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Tự Động Bắt Link Truyện:** Chỉ cần dán link truyện (uukanshu, 69shuba, truyenfull, fanqie, v.v.), ứng dụng sẽ tự động bóc tách đúng nội dung chương, bỏ qua toàn bộ quảng cáo, đồng thời nhận diện nút điều hướng chương trước/sau cực kỳ tiện lợi.
- 🧠 **Bộ Não Dịch Thuật Đa Tầng:**
  1. **VietPhrase Engine:** Dịch thô siêu tốc với 7 lớp từ điển (Luật Nhân, Names, Pronouns, Vietphrase, HanViet...). Hỗ trợ popup tra cứu chéo (Thiều Chửu, Lạc Việt) ngay trên văn bản.
  2. **Tích Hợp Sức Mạnh AI & API:** Dịch mượt mà, bay bổng như người thật với các công cụ xịn sò nhất hiện nay:
     - **Mô hình AI hàng đầu:** Hỗ trợ kết nối trực tiếp với Google Gemini (1.5, 2.0, 2.5), OpenAI ChatGPT, Claude, và DeepSeek.
     - **API Dịch thuật phổ biến:** Dùng thả ga với Google Translate, Microsoft Bing, Youdao, MyMemory. Hoặc xài bản nâng cao (cần API key) như Baidu, Caiyun, DeepL.
     - **Hỗ trợ Local AI:** Thoải mái kết nối tới các server AI chạy nội bộ trên máy bạn (ví dụ: Sakura LLM, Ollama...) để dịch offline và bảo mật.
- ⚡ **Tối Ưu Tốc Độ (Chunking & Streaming):** Hiển thị kết quả dịch theo thời gian thực (streaming) ngay khi đang tải. Ứng dụng tự động chia nhỏ các đoạn văn bản dài (chunking) để không bao giờ bị nghẽn mạng hay vượt quá giới hạn của các máy chủ miễn phí.
- 🎨 **Giao Diện Trực Quan:** Thiết kế **Dark Mode / Light Mode** sang trọng, hiện đại. Tự động đồng bộ hóa thanh cuộn và bôi màu highlight đoạn đang đọc giữa Bản Gốc - Bản VietPhrase - Bản Dịch Hoàn Chỉnh.
- 🛠️ **Quản Lý Từ Điển Tiện Dụng:** Bôi đen tên nhân vật mới (`Ctrl + E`) để nạp ngay vào từ điển. Lưu lịch sử đọc truyện để tiện theo dõi, mọi tùy chỉnh cá nhân đều được lưu giữ đồng bộ.
- 📥 **Xuất File Nhanh Chóng:** Hỗ trợ xuất ngay toàn bộ kết quả dịch thành file văn bản TXT để bạn lưu trữ hoặc chép vào điện thoại, máy đọc sách.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Yêu Cầu Hệ Thống
- Máy tính cài đặt sẵn **Python 3.8** trở lên.

### 2. Khởi Động (Dành cho Windows)
1. Tải toàn bộ mã nguồn này về máy tính của bạn.
2. Click đúp vào file `run_web.bat`.
3. Quá trình thiết lập diễn ra hoàn toàn tự động, ứng dụng sẽ tự mở trình duyệt web tại địa chỉ `http://localhost:8000` và sẵn sàng sử dụng!

*Lưu ý: Bạn bắt buộc phải chạy qua file `.bat` để công cụ có thể tự do lấy dữ liệu từ các trang web (vượt rào cản CORS) và đọc từ điển từ ổ cứng. Không click đúp trực tiếp vào file HTML.*

---

## 📂 Cấu Trúc Thư Mục

```
TienDich/
├── server.py         # Backend Proxy nội bộ (Vượt lỗi CORS, bóc tách truyện)
├── run_web.bat       # Mã script khởi động nhanh cho Windows
├── index.html        # Giao diện chính của ứng dụng
├── css/              # Chứa các bộ định dạng giao diện (.css)
├── js/               # Mã nguồn xử lý lõi (Dịch thuật, lấy nội dung web, sự kiện)
└── data/             # Nơi chứa kho tàng các tập tin từ điển VietPhrase
```

---

## 📝 Nâng Cấp Từ Điển

Hệ thống cho phép bạn tùy ý nâng cấp và làm phong phú thêm bộ từ điển của mình bằng cách tải các file từ điển chuẩn về và chép đè vào thư mục `data/`. Phần mềm sẽ tự động nhận diện dữ liệu mới!

Nếu bạn có danh sách tên nhân vật hoặc từ ngữ riêng, bạn có thể dễ dàng dán danh sách đó vào mục **Cài đặt** trên ứng dụng, hoặc dùng tính năng bôi đen trên văn bản để bổ sung từng từ một cách nhanh chóng.

---
*Chúc bạn có những giờ phút đọc và chuyển ngữ truyện thật thư giãn!* 🍵
