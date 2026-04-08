const {
    getDashboardStats: getDashboardStatsService,
    getStaffStats: getStaffStatsService
} = require('../services/statsService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// ─────────────────────────────────────────────
// [ADMIN] GET /api/stats/dashboard
// Trả về toàn bộ thống kê tổng quan cho Admin Dashboard
// Test Postman: GET http://localhost:5000/api/stats/dashboard
//              Header: Authorization: Bearer <admin_token>
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const data = await getDashboardStatsService();
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

// ─────────────────────────────────────────────
// [ADMIN/STAFF] GET /api/stats/staff
// Thống kê dành cho Staff Dashboard
// Test Postman: GET http://localhost:5000/api/stats/staff
//              Header: Authorization: Bearer <staff_token>
// ─────────────────────────────────────────────
const getStaffStats = async (req, res) => {
    try {
        const data = await getStaffStatsService();
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

module.exports = { getDashboardStats, getStaffStats };
