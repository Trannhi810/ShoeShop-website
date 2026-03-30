// admin-dashboard.js — Dashboard tổng quan (đọc dữ liệu MongoDB qua API)
// Yêu cầu: admin-utils.js, api-client.js load trước.

initAdminPage();

async function renderDashboardStats() {
  try {
    const [usersTotal, usersActive, productsTotal, categories] = await Promise.all([
      userApi.stats.total(),
      userApi.stats.active(),
      productApi.getAll('limit=1&page=1'),
      categoryApi.getAll()
    ]);

    const usersTotalVal = usersTotal?.total ?? '—';
    const usersActiveVal = usersActive?.total ?? '—';
    const productsTotalVal = productsTotal?.total ?? '—';
    const categoriesVal = Array.isArray(categories)
      ? categories.length
      : (categories?.categories?.length ?? '—');

    const el1 = document.getElementById('stat-users-total');
    const el2 = document.getElementById('stat-users-active');
    const el3 = document.getElementById('stat-products-total');
    const el4 = document.getElementById('stat-categories-total');

    if (el1) el1.textContent = usersTotalVal;
    if (el2) el2.textContent = usersActiveVal;
    if (el3) el3.textContent = productsTotalVal;
    if (el4) el4.textContent = categoriesVal;
  } catch (err) {
    showToast(err.message || 'Lỗi tải dashboard', 'error');
  }
}

renderDashboardStats();

// Nếu admin vừa cập nhật dữ liệu ở trang khác rồi quay lại dashboard
// thì làm mới thống kê để phản ánh dữ liệu mới trong MongoDB.
window.addEventListener('focus', renderDashboardStats);

