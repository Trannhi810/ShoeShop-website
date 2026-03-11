# ShoeShop Website

## Giới thiệu

ShoeShop Website là một website bán giày đơn giản được xây dựng để thực hành phát triển ứng dụng web.
Dự án gồm **Frontend** và **Backend** tách riêng, Backend cung cấp API để Frontend lấy dữ liệu sản phẩm.

---

# Công nghệ sử dụng

### Backend

* Node.js
* Express.js
* MongoDB

### Frontend

* HTML
* CSS
* JavaScript (Fetch API)

---

# Cấu trúc thư mục

```
ShoeShop-website
│
├── Backend
│   ├── app.js
│   ├── package.json
│
├── Frontend
│   ├── index.html
│
└── README.md
```

---

# Chức năng hiện tại

### Backend

* Kết nối MongoDB
* API lấy danh sách sản phẩm
* API thêm sản phẩm

### Frontend

* Hiển thị danh sách giày
* Gọi API từ backend để load sản phẩm

---

# API

## Lấy danh sách sản phẩm

GET

```
http://localhost:5000/api/products
```

Response:

```
[
 {
   "_id": "...",
   "name": "Nike Air",
   "price": 120
 }
]
```

---

## Thêm sản phẩm

POST

```
http://localhost:5000/api/products
```

Body JSON:

```
{
 "name": "Nike Air",
 "price": 120
}
```

---

# Cách chạy project

## 1. Clone project

```
git clone https://github.com/Trannhi810/ShoeShop-website.git
```

---

## 2. Chạy Backend

Vào thư mục backend

```
cd Backend
```

Cài thư viện

```
npm install
```

Chạy server

```
node app.js
```

Server chạy tại:

```
http://localhost:5000
```

---

## 3. Chạy Frontend

Mở file:

```
Frontend/index.html
```

trên trình duyệt.

Sau đó bấm **Load Products** để lấy dữ liệu từ backend.

---

# Database

Sử dụng MongoDB.

Database:

```
shoeshop
```

Collection:

```
products
```

Ví dụ dữ liệu:

```
{
 "name": "Nike Air",
 "price": 120
}
```

---


