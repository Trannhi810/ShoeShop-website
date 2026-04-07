/**
 * pageRoutes.js — Serve các trang HTML từ Frontend/pages/
 * Mỗi trang gọi API backend tương ứng qua fetch() với JWT token.
 * Tất cả API endpoints có thể test độc lập trên Postman.
 */
const express = require('express');
const router  = express.Router();
const path    = require('path');

const FRONTEND = path.join(__dirname, '../../Frontend');

// ===== ADMIN PAGES =====
router.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/admin-dashboard.html'));
});

router.get('/admin-users', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/admin-users.html'));
});

router.get('/admin-products', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/admin-products.html'));
});

router.get('/admin-categories', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/admin-categories.html'));
});

router.get('/admin-orders', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/admin-orders.html'));
});

// ===== AUTH PAGE =====
router.get('/auth', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/auth.html'));
});

// ===== CUSTOMER PAGES =====
router.get('/products', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/products.html'));
});

router.get('/cart', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/cart.html'));
});

router.get('/checkout', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/checkout.html'));
});

router.get('/orders', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/orders.html'));
});

router.get('/product-detail/:id', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/product-detail.html'));
});

router.get('/notifications', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/notifications.html'));
});

// ===== STAFF PAGES =====
router.get('/staff-dashboard', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/staff-dashboard.html'));
});

router.get('/staff-orders', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/staff-orders.html'));
});

router.get('/staff-products', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'pages/staff-products.html'));
});

module.exports = router;
