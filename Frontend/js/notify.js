const NOTIFICATIONS_KEY = "shoeshop_notifications_v1";
const USER_KEY = "shoeshop_current_user_v1";

function getNotifications() {
  return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(USER_KEY));
}

function addNotification({ title, message, role = "customer", type = "info" }) {
  const notifications = getNotifications();

  const newNotification = {
    id: Date.now(),
    title,
    message,
    role,
    type,
    isRead: false,
    createdAt: new Date().toLocaleString("vi-VN")
  };

  notifications.unshift(newNotification);
  saveNotifications(notifications);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === role) {
    showToast(title, message, type);
    renderNotificationBell();
  }
}

function getNotificationsByRole(role) {
  return getNotifications().filter(item => item.role === role);
}

function getUnreadCount(role) {
  return getNotificationsByRole(role).filter(item => !item.isRead).length;
}

function markAllAsRead(role) {
  const notifications = getNotifications();
  notifications.forEach(item => {
    if (item.role === role) {
      item.isRead = true;
    }
  });
  saveNotifications(notifications);
  renderNotificationBell();
}

function markOneAsRead(id) {
  const notifications = getNotifications();
  const item = notifications.find(n => n.id === id);
  if (item) item.isRead = true;
  saveNotifications(notifications);
  renderNotificationBell();
}

function deleteNotification(id) {
  let notifications = getNotifications();
  notifications = notifications.filter(item => item.id !== id);
  saveNotifications(notifications);
  renderNotificationBell();
}

function showToast(title, message, type = "info") {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function renderNotificationBell() {
  const bellArea = document.getElementById("notificationBellArea");
  if (!bellArea) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    bellArea.innerHTML = "";
    return;
  }

  const unreadCount = getUnreadCount(currentUser.role);

  bellArea.innerHTML = `
    <a class="notification-bell" href="/Frontend/pages/notifications.html" title="Thông báo">
      🔔
      ${unreadCount > 0 ? `<span class="notification-badge">${unreadCount}</span>` : ""}
    </a>
  `;
}

function seedNotifications() {
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    const sampleNotifications = [
      {
        id: 1,
        title: "Chào mừng",
        message: "Chào mừng bạn đến với ShoeShop.",
        role: "customer",
        type: "info",
        isRead: false,
        createdAt: new Date().toLocaleString("vi-VN")
      },
      {
        id: 2,
        title: "Thông báo staff",
        message: "Bạn có thể quản lý đơn hàng mới tại dashboard.",
        role: "staff",
        type: "info",
        isRead: false,
        createdAt: new Date().toLocaleString("vi-VN")
      },
      {
        id: 3,
        title: "Thông báo admin",
        message: "Hệ thống quản trị đã sẵn sàng.",
        role: "admin",
        type: "success",
        isRead: false,
        createdAt: new Date().toLocaleString("vi-VN")
      }
    ];

    saveNotifications(sampleNotifications);
  }
}