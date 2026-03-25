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

  const users = getUsers();

  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp");
    return;
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    alert("Email đã tồn tại");
    return;
  }

  const newUser = {
    id: Date.now(),
    fullName,
    email,
    password,
    role: "customer"
  };

  users.push(newUser);
  saveUsers(users);

  alert("Đăng ký thành công");
  window.location.href = "./login.html";
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();
  const user = users.find(item => item.email === email && item.password === password);

  if (!user) {
    alert("Sai email hoặc mật khẩu");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  alert("Đăng nhập thành công");

  if (user.role === "admin") {
    window.location.href = "./admin-dashboard.html";
    return;
  }

  if (user.role === "staff") {
    window.location.href = "./staff-dashboard.html";
    return;
  }

  window.location.href = "../index.html";
}

function logout() {
  localStorage.removeItem("user");
  alert("Đã đăng xuất");
  window.location.href = "../index.html";
}
