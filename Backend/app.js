require("dotenv").config();
const express = require("express");
const path = require("path");

const connectDB = require("./config/database");
const productRoutes  = require("./routes/productRoutes");
const userRoutes     = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes     = require("./routes/cartRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gọi hàm kết nối database
connectDB();

// API
app.use("/api/products",   productRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart",       cartRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "../Frontend")));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

app.get("/pages/products.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/products.html"));
});

app.get("/pages/admin-dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/admin-dashboard.html"));
});

app.get("/pages/admin-products.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/admin-products.html"));
});

app.get("/pages/admin-users.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/admin-users.html"));
});

app.get("/pages/admin-orders.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/admin-orders.html"));
});

app.get("/pages/admin-categories.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/admin-categories.html"));
});

app.get("/pages/staff-dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/staff-dashboard.html"));
});

app.get("/pages/auth.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/auth.html"));
});

app.get("/components/header.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/components/header.html"));
});

app.get("/components/footer.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/components/footer.html"));
});

app.get("/components/sidebar.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/components/sidebar.html"));
});

app.get("/pages/notifications.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/pages/notifications.html"));
});

// Ưu tiên dùng PORT trong file .env, nếu không có thì chạy port 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});