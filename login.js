/* ============================================
   login.js — Login + Registration with UID verification
   ============================================ */

const API_BASE = 'http://localhost:3000';

// ---- Elements ----
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const tabIndicator = document.getElementById('tabIndicator');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const remember = document.getElementById('remember');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');

const regUsername = document.getElementById('regUsername');
const regPassword = document.getElementById('regPassword');
const regPasswordConfirm = document.getElementById('regPasswordConfirm');
const registerBtn = document.getElementById('registerBtn');
const registerStatus = document.getElementById('registerStatus');

// ---- Tab Switching ----
loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));

function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        tabIndicator.classList.remove('right');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        tabIndicator.classList.add('right');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    clearAllStatus();
}

function clearAllStatus() {
    loginStatus.textContent = '';
    loginStatus.className = 'auth-status mt-3';
    registerStatus.textContent = '';
    registerStatus.className = 'auth-status mt-3';
}

function setStatus(el, message, kind) {
    el.textContent = message;
    el.className = 'auth-status mt-3';
    if (kind) el.classList.add(kind);
}

// ---- Password Toggle ----
document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector('i');
        if (target.type === 'password') {
            target.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            target.type = 'password';
            icon.className = 'bi bi-eye';
        }
    });
});



// ---- Register Form Validation ----
regUsername.addEventListener('input', validateRegisterForm);
regPassword.addEventListener('input', validateRegisterForm);
regPasswordConfirm.addEventListener('input', validateRegisterForm);

function validateRegisterForm() {
    const valid = regUsername.value.trim().length > 0
        && regPassword.value.length >= 1
        && regPassword.value === regPasswordConfirm.value;
    registerBtn.disabled = !valid;
}

// ---- LOGIN ----
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
        setStatus(loginStatus, 'Please enter both username and password.', 'error');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    setStatus(loginStatus, '', null);

    try {
        const res = await fetch(API_BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            setStatus(loginStatus, data.message || 'Logged in successfully!', 'success');
            const store = remember.checked ? localStorage : sessionStorage;
            if (data.token) store.setItem('authToken', data.token);
            if (data.user) store.setItem('zeus_user', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = '/products.html'; }, 800);
        } else {
            setStatus(loginStatus, data.error || 'Login failed.', 'error');
        }
    } catch (err) {
        setStatus(loginStatus, 'Network error: ' + err.message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
    }
});

// ---- REGISTER ----
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = regUsername.value.trim();
    const password = regPassword.value;
    const confirmPw = regPasswordConfirm.value;

    if (!username || !password) {
        setStatus(registerStatus, 'All fields are required.', 'error');
        return;
    }
    if (password !== confirmPw) {
        setStatus(registerStatus, 'Passwords do not match.', 'error');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
    setStatus(registerStatus, '', null);

    try {
        const res = await fetch(API_BASE + '/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            setStatus(registerStatus, 'Account created! Switching to login...', 'success');
            setTimeout(() => {
                switchTab('login');
                loginUsername.value = username;
                loginPassword.focus();
            }, 1200);
        } else {
            setStatus(registerStatus, data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        setStatus(registerStatus, 'Network error: ' + err.message, 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
    }
});