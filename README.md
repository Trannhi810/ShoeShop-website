# ShoeShop Website

## 🚀 Hướng dẫn cài đặt & chạy dự án

### Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) (v18 trở lên)
- [MongoDB](https://www.mongodb.com/try/download/community) đã được cài đặt và đang chạy trên máy

### Các bước thực hiện

**1. Clone dự án về máy**
```bash
git clone <repository-url>
cd ShoeShop-website
```

**2. Cài đặt dependencies cho Backend**
```bash
cd Backend
npm install
```

**3. Tạo file `.env` từ file mẫu**
```bash
# Sao chép file mẫu
copy .env.example .env
```
Sau đó mở file `.env` và chỉnh sửa nếu cần (ví dụ: đổi PORT, hoặc dùng MongoDB Atlas URI).

**4. Đảm bảo MongoDB đang chạy trên máy**
- Nếu dùng MongoDB cục bộ: mở `mongosh` hoặc khởi động MongoDB service trước.
- Nếu dùng MongoDB Atlas (cloud): thay `MONGODB_URI` trong `.env` bằng connection string của Atlas.

**5. Chạy server**
```bash
npm start
```

**6. Mở trình duyệt**

Truy cập: [http://localhost:3000](http://localhost:3000)

---

## 📁 Cấu trúc dự án

```
ShoeShop-website/
├── Backend/
│   ├── config/         # Cấu hình database
│   ├── controllers/    # Xử lý logic API
│   ├── middlewares/    # Middleware xác thực
│   ├── routes/         # Định nghĩa routes
│   ├── schemas/        # MongoDB schemas
│   ├── .env.example    # File mẫu biến môi trường (cần copy thành .env)
│   ├── app.js          # Entry point
│   └── package.json
└── Frontend/
    ├── index.html
    └── auth.html
```

## ⚠️ Lưu ý quan trọng

- File `.env` **KHÔNG được commit** lên GitHub vì lý do bảo mật.
- Mỗi thành viên cần tự tạo file `.env` từ `.env.example`.
- `node_modules/` cũng không được commit — chạy `npm install` sau khi clone.