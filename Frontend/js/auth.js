// auth.js — Logic trang Đăng nhập / Đăng ký
// File này không cần admin-utils.js (trang công khai)

function switchTab(tab) {
    const slider          = document.getElementById('form-slider');
    const indicator       = document.getElementById('indicator');
    const btns            = document.querySelectorAll('.toggle-btn');
    const sectionLogin    = document.getElementById('section-login');
    const sectionRegister = document.getElementById('section-register');

    showMessage('', '');

    if (tab === 'login') {
        slider.style.transform    = 'translateX(0)';
        indicator.style.transform = 'translateX(0)';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        sectionLogin.classList.add('active');
        sectionRegister.classList.remove('active');
    } else {
        slider.style.transform    = 'translateX(-50%)';
        indicator.style.transform = 'translateX(100%)';
        btns[1].classList.add('active');
        btns[0].classList.remove('active');
        sectionRegister.classList.add('active');
        sectionLogin.classList.remove('active');
    }
}

// 👁️ Toggle Show/Hide Password
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function showMessage(msg, type) {
    const box = document.getElementById('message-box');
    if (!msg) { box.classList.remove('show'); return; }
    box.className   = `message-box ${type} show`;
    box.innerText   = msg;
}

function toggleLoading(btnId, isLoading) {
    const btn     = document.getElementById(btnId);
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.loading-spinner');
    text.style.display    = isLoading ? 'none'  : 'block';
    spinner.style.display = isLoading ? 'block' : 'none';
    btn.disabled          = isLoading;
}

// Điều hướng theo role sau khi đăng nhập thành công
function redirectByRole(role) {
    if (role === 'ADMIN') {
        window.location.href = '/admin-users.html';
    } else {
        window.location.href = '/index.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    toggleLoading('btn-login', true);
    showMessage('', '');

    try {
        const res  = await fetch('/api/users/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            if (data.user && data.user.isActive === false) {
                showMessage('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 'error');
                return;
            }
            localStorage.setItem('shoeshop_token', data.token);
            localStorage.setItem('shoeshop_user',  JSON.stringify(data.user));

            const role = data.user?.role || 'CUSTOMER';
            const msg  = role === 'ADMIN'
                ? '👑 Chào mừng Admin! Đang vào trang quản trị...'
                : '✅ Đăng nhập thành công! Đang chuyển hướng...';
            showMessage(msg, 'success');
            setTimeout(() => redirectByRole(role), 1000);
        } else {
            showMessage(data.message || 'Sai thông tin đăng nhập', 'error');
        }
    } catch (_) {
        showMessage('Lỗi kết nối tới máy chủ', 'error');
    } finally {
        toggleLoading('btn-login', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName        = document.getElementById('reg-name').value;
    const email           = document.getElementById('reg-email').value;
    const password        = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const phone           = document.getElementById('reg-phone').value;
    const address         = document.getElementById('reg-address').value;

    if (password !== confirmPassword) {
        showMessage('Mật khẩu xác nhận không trùng khớp!', 'error');
        return;
    }

    toggleLoading('btn-register', true);
    showMessage('', '');

    try {
        const payload = { fullName, email, password };
        if (phone)   payload.phone   = phone;
        if (address) payload.address = address;

        const res  = await fetch('/api/users/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            showMessage('Tạo tài khoản thành công! Tự động đăng nhập...', 'success');
            localStorage.setItem('shoeshop_token', data.token);
            localStorage.setItem('shoeshop_user',  JSON.stringify(data.user));
            setTimeout(() => redirectByRole(data.user?.role || 'CUSTOMER'), 1500);
        } else {
            showMessage(data.message || 'Đăng ký thất bại', 'error');
        }
    } catch (_) {
        showMessage('Lỗi kết nối tới máy chủ', 'error');
    } finally {
        toggleLoading('btn-register', false);
    }
}

async function handleGoogleCallback(response) {
    const token = response.credential;
    showMessage('Đang xác thực với Google...', 'success');

    try {
        const res  = await fetch('/api/users/google-login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token })
        });
        const data = await res.json();

        if (res.ok) {
            showMessage('Đăng nhập Google thành công! Đang chuyển hướng...', 'success');
            localStorage.setItem('shoeshop_token', data.token);
            localStorage.setItem('shoeshop_user',  JSON.stringify(data.user));
            setTimeout(() => redirectByRole(data.user?.role || 'CUSTOMER'), 1000);
        } else {
            showMessage(data.message || 'Xác thực Google thất bại', 'error');
        }
    } catch (_) {
        showMessage('Lỗi kết nối tới máy chủ', 'error');
    }
}

// Nếu đã đăng nhập thì điều hướng theo role, không cho vào lại trang login
window.onload = () => {
    const token = localStorage.getItem('shoeshop_token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('shoeshop_user') || '{}');
        redirectByRole(user.role || 'CUSTOMER');
    }
};
