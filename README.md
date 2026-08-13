<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/language.svg" width="100" height="100" alt="Tiên Dịch Logo">
  
  # Tiên Dịch (Web Translator)
  
  **Tiên Dịch** là một ứng dụng web dịch thuật truyện chữ Trung Quốc chuyên nghiệp, hoạt động hoàn toàn trực tiếp trên trình duyệt web của bạn, không cần cài đặt thêm phần mềm!
  
  Dựa trên sức mạnh của **Quick Translator**, hệ thống đã được thiết kế lại bằng JavaScript với giao diện tối ưu, hiện đại, mượt mà và thân thiện.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with JS](https://img.shields.io/badge/Made_with-JavaScript-f7df1e.svg?style=flat&logo=javascript&logoColor=black)]()
</div>

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Hoạt động 100% trên Trình Duyệt:** Tốc độ dịch cực cao (chỉ tính bằng mili-giây) nhờ sức mạnh của các trình duyệt hiện đại (Chrome, Firefox, Edge, Safari).
- 🧠 **Bộ Não Quick Translator:** Tích hợp trọn bộ từ điển "đồ sộ" của Quick Translator với 7 lớp ưu tiên dịch thuật hoàn hảo:
  1. Luật Nhân (Pattern Matching - ví dụ: `{n}面前` -> `trước mặt {n}`)
  2. Từ Điển Cá Nhân (do bạn tự định nghĩa)
  3. Names.txt (Tên riêng)
  4. Names2.txt (Tên riêng bổ sung)
  5. Pronouns.txt (Đại từ nhân xưng)
  6. Vietphrase.txt (Từ điển cốt lõi - 36MB)
  7. HanViet.txt (Âm Hán Việt dự phòng)
- 📖 **Từ Điển Phụ Trợ Đa Dạng:** Tra cứu chéo dễ dàng với các bộ từ điển nổi tiếng: `Thiều Chửu`, `Lạc Việt`, `Babylon`, và `Phiên Âm`.
- 🎨 **Giao Diện Siêu Đẹp:** Thiết kế **Dark Mode / Light Mode** sang trọng, hiện đại. Chia cột trực quan (Bản Gốc bên trái, Bản Dịch bên phải).
- ✨ **Popup Tra Từ Thông Minh:** Bôi đen bất kỳ cụm từ nào để lập tức tra nghĩa, Pinyin và âm Hán Việt.
- ⚙️ **Thêm Tên Nhanh Chóng:** Phát hiện nhân vật mới? Chỉ cần tô đậm và ấn `Ctrl + E` để thêm ngay vào từ điển. 

---

## 📸 Ảnh Chụp Màn Hình

*(Bạn có thể thay thế bằng ảnh thật của ứng dụng tại đây)*

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Dùng Trực Tiếp (GitHub Pages)

Do ứng dụng được viết bằng HTML/JS tĩnh, bạn có thể truy cập ngay lập tức bằng **GitHub Pages** mà không cần tải về máy:
👉 **[Truy cập Tiên Dịch tại đây](https://ParadoxParadise.github.io/TienDich/)**

### 2. Chạy Cục Bộ (Local)

Nếu bạn muốn chỉnh sửa code hoặc chạy offline:
1. Tải toàn bộ source code này về máy.
2. Bạn **KHÔNG THỂ** nháy đúp vào file `index.html` do trình duyệt chặn bảo mật CORS khi đọc file từ điển cục bộ.
3. Thay vào đó, hãy click đúp vào file `run_web.bat`. Nó sẽ tự động khởi tạo một máy chủ ảo (server) và mở ứng dụng lên cho bạn một cách trơn tru!

---

## 📂 Cấu Trúc Thư Mục

```
TienDich/
├── index.html        # Giao diện chính của ứng dụng
├── run_web.bat       # Script khởi động server cục bộ
├── css/              # Chứa các file giao diện (.css)
├── js/               # Mã nguồn xử lý (Engine, UI, Max-Match...)
└── data/             # Nơi chứa kho tàng từ điển của bạn
    ├── Vietphrase.txt
    ├── Names.txt
    ├── LuatNhan.txt
    ├── ThieuChuu.txt
    ├── LacViet.txt
    ├── ... (và nhiều file khác)
```

---

## 📝 Quản Lý Từ Điển

Bạn có thể tải lên kho từ điển mới (của Quick Translator) và quăng đè vào thư mục `data/`. Hệ thống sẽ tự động nhận diện và cập nhật sức mạnh dịch thuật!

Nếu bạn có từ điển cá nhân tự dịch, bạn cũng có thể mở tab **Cài đặt** trong ứng dụng để nạp trực tiếp danh sách từ của mình.

---
*Chúc bạn có những giờ phút đọc truyện và dịch truyện tuyệt vời cùng Tiên Dịch!* 🍵
