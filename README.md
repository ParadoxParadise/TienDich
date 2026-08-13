<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/language.svg" width="100" height="100" alt="Tiên Dịch Logo">
  
  # Tiên Dịch (Web Translator)
  
  **Tiên Dịch** là một ứng dụng web dịch thuật truyện chữ Trung Quốc chuyên nghiệp, hoạt động hoàn toàn trực tiếp trên trình duyệt web của bạn, không cần cài đặt thêm phần mềm!
  
  Hệ thống được thiết kế bằng JavaScript với giao diện tối ưu, hiện đại, mượt mà và thân thiện với người sử dụng.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with JS](https://img.shields.io/badge/Made_with-JavaScript-f7df1e.svg?style=flat&logo=javascript&logoColor=black)]()
</div>

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Hoạt động 100% trên Trình Duyệt:** Tốc độ dịch cực cao nhờ sức mạnh của các trình duyệt hiện đại (Chrome, Firefox, Edge, Safari).
- 🧠 **Bộ Não Dịch Thuật Đa Tầng:** Tích hợp hệ thống từ điển đồ sộ với 7 lớp ưu tiên dịch thuật hoàn hảo:
  1. Luật Nhân (Pattern Matching - ví dụ: `{n}面前` -> `trước mặt {n}`)
  2. Từ Điển Cá Nhân (do bạn tự định nghĩa)
  3. Names.txt (Tên riêng)
  4. Names2.txt (Tên riêng bổ sung)
  5. Pronouns.txt (Đại từ nhân xưng)
  6. Vietphrase.txt (Từ điển cốt lõi)
  7. HanViet.txt (Âm Hán Việt dự phòng)
- 📖 **Từ Điển Phụ Trợ Đa Dạng:** Tra cứu chéo dễ dàng với các bộ từ điển nổi tiếng: `Thiều Chửu`, `Lạc Việt`, `Babylon`, và `Phiên Âm`.
- 🎨 **Giao Diện Trực Quan:** Thiết kế **Dark Mode / Light Mode** sang trọng. Chia cột thông minh (Bản Gốc bên trái, Bản Dịch bên phải) giúp dễ dàng đối chiếu.
- ✨ **Popup Tra Từ Thông Minh:** Bôi đen bất kỳ cụm từ nào để lập tức tra nghĩa, Pinyin và âm Hán Việt.
- ⚙️ **Thêm Tên Nhanh Chóng:** Phát hiện nhân vật mới? Chỉ cần bôi đen và ấn `Ctrl + E` để thêm ngay vào từ điển. 

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Dùng Trực Tiếp (GitHub Pages)

Do ứng dụng được viết bằng HTML/JS tĩnh, bạn có thể truy cập ngay lập tức bằng **GitHub Pages** mà không cần tải về máy:
👉 **[Truy cập Tiên Dịch tại đây](https://ParadoxParadise.github.io/TienDich/)**

### 2. Chạy Cục Bộ (Local)

Nếu bạn muốn chỉnh sửa code hoặc chạy offline trên máy tính:
1. Tải toàn bộ source code này về máy.
2. Trình duyệt có thể chặn bảo mật CORS khi đọc file từ điển cục bộ nếu bạn chỉ click đúp vào file `index.html`.
3. Thay vào đó, hãy chạy file `run_web.bat`. Nó sẽ tự động khởi tạo một local server và mở ứng dụng lên cho bạn!

---

## 📂 Cấu Trúc Thư Mục

```
TienDich/
├── index.html        # Giao diện chính của ứng dụng
├── run_web.bat       # Script khởi động server cục bộ
├── css/              # Chứa các file giao diện (.css)
├── js/               # Mã nguồn xử lý (Engine, UI, Max-Match...)
└── data/             # Nơi chứa kho tàng từ điển
    ├── Vietphrase.txt
    ├── Names.txt
    ├── LuatNhan.txt
    ├── ... (và các file từ điển khác)
```

---

## 📝 Quản Lý Từ Điển

Hệ thống cho phép bạn tùy ý nâng cấp bộ từ điển bằng cách tải lên các file từ điển chuẩn và thay thế vào thư mục `data/`. Hệ thống sẽ tự động nhận diện và cập nhật!

Nếu bạn có từ điển cá nhân, bạn có thể nạp trực tiếp danh sách từ của mình thông qua tab **Cài đặt** ngay trong ứng dụng.

---
*Chúc bạn có những giờ phút đọc truyện và dịch truyện tuyệt vời!* 🍵
