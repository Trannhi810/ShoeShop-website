require("dotenv").config();
const express = require("express");
const path = require("path");

const connectDB = require("./config/database");
const productRoutes  = require("./routes/productRoutes");
const userRoutes     = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(express.json());

// Gọi hàm kết nối database
connectDB();

// API
app.use("/api/products",   productRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/categories", categoryRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "../Frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

app.get("/admin-users", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/admin-users.html"));
});

app.get("/admin-products", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/admin-products.html"));
});

app.get("/admin-categories", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/admin-categories.html"));
});

// Ưu tiên dùng PORT trong file .env, nếu không có thì chạy port 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});