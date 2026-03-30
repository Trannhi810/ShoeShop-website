function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function handleRegister(event) {
  event.preventDefault();

  const fullName = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerConfirmPassword").value;
  const phone = document.getElementById("registerPhone").value.trim();
  const address = document.getElementById("registerAddress").value.trim();

  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp");
    return;
  }

  fetch("/api/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      fullName,
      phone: phone || undefined,
      address: address || undefined,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        alert("Đăng ký thành công");
        window.location.href = "/pages/auth.html";
      } else {
        alert("Đăng ký thất bại: " + (data.message || "Lỗi không xác định"));
      }
    })
    .catch((error) => {
      console.error("Register Error:", error);
      alert("Lỗi: " + error.message);
    });
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        // Đồng bộ key theo format mà các trang admin dùng API backend kỳ vọng
        localStorage.setItem("shoeshop_user", JSON.stringify(data.user));
        localStorage.setItem("shoeshop_token", data.token);
        alert("Đăng nhập thành công");

        if (data.user.role === "ADMIN") {
          window.location.href = "/admin-dashboard.html";
        } else if (data.user.role === "STAFF") {
          window.location.href = "/pages/staff-dashboard.html";
        } else {
          window.location.href = "/pages/products.html";
        }
      } else {
        alert("Sai email hoặc mật khẩu");
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      alert("Lỗi: " + error.message);
    });
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("shoeshop_user");
  localStorage.removeItem("shoeshop_token");
  alert("Đã đăng xuất");
  window.location.href = "../index.html";
}

function switchTab(tab) {
  const loginSection = document.getElementById("section-login");
  const registerSection = document.getElementById("section-register");
  const loginBtn = document.querySelectorAll(".toggle-btn")[0];
  const registerBtn = document.querySelectorAll(".toggle-btn")[1];
  const indicator = document.getElementById("indicator");

  if (tab === "login") {
    loginSection.classList.add("active");
    registerSection.classList.remove("active");
    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");
    indicator.style.left = "0%";
  } else {
    loginSection.classList.remove("active");
    registerSection.classList.add("active");
    loginBtn.classList.remove("active");
    registerBtn.classList.add("active");
    indicator.style.left = "50%";
  }
}

function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

function handleGoogleCallback(response) {
  if (!response.credential) {
    alert("Không nhận được credential từ Google");
    return;
  }

  // Gửi token lên backend để verify và tạo user
  fetch("/api/users/google-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: response.credential,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        // Lưu user info và token vào localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        // Đồng bộ key theo format mà các trang admin dùng API backend kỳ vọng
        localStorage.setItem("shoeshop_user", JSON.stringify(data.user));
        localStorage.setItem("shoeshop_token", data.token);

        alert("Đăng nhập Google thành công!");

        // Redirect theo role
        if (data.user.role === "ADMIN") {
          window.location.href = "/admin-dashboard.html";
        } else if (data.user.role === "STAFF") {
          window.location.href = "/pages/staff-dashboard.html";
        } else {
          window.location.href = "/index.html";
        }
      } else {
        alert("Đăng nhập thất bại: " + (data.message || "Lỗi không xác định"));
      }
    })
    .catch((error) => {
      console.error("Google Login Error:", error);
      alert("Lỗi kết nối: " + error.message);
    });
}
// Handle URL tab parameter - switch to register tab if tab=register in URL
document.addEventListener("DOMContentLoaded", function() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");
  
  if (tab === "register") {
    switchTab("register");
  }
});
// Check URL parameter để tự động switch tab khi load
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  
  if (tab === "register") {
    switchTab("register");
  }
});
