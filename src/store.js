/* ============================================
   store.js — Shared utilities & Supabase client
   ============================================
   The publishable key is used client-side.
   All sensitive operations go through server.js
   using the secret key.
   ============================================ */

const API_BASE = 'http://localhost:3000';

// --------------- Cart (localStorage) ---------------

function getCart() {
    try {
        return JSON.parse(localStorage.getItem('zeus_cart') || '[]');
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('zeus_cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.product_num === product.product_num);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            pid: product.pid,
            product_num: product.product_num,
            product_name: product.product_name,
            product_price: product.product_price,
            qty: 1
        });
    }
    saveCart(cart);
}

function removeFromCart(product_num) {
    let cart = getCart();
    cart = cart.filter(item => item.product_num !== product_num);
    saveCart(cart);
}

function updateCartQty(product_num, delta) {
    const cart = getCart();
    const item = cart.find(i => i.product_num === product_num);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(product_num);
        return;
    }
    saveCart(cart);
}

function clearCart() {
    localStorage.removeItem('zeus_cart');
    updateCartBadge();
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.product_price * item.qty, 0);
}

function getCartItemCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// --------------- Cart Badge ---------------

function updateCartBadge() {
    const badge = document.getElementById('navCartBadge');
    if (!badge) return;
    const count = getCartItemCount();
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// --------------- Auth helpers ---------------

function getAuthUser() {
    const raw = localStorage.getItem('zeus_user') || sessionStorage.getItem('zeus_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function setNavUser() {
    const user = getAuthUser();
    const el = document.getElementById('navUsername');
    if (el && user) {
        el.textContent = user.username || 'User';
    }
}

// --------------- Currency Formatter ---------------

function formatCurrency(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --------------- Product image helper ---------------

// Map product_num to local image file
const PRODUCT_IMAGES = {
    111: 'product_x.png',
    112: 'product_y.png'
};

function getProductImage(product_num) {
    return PRODUCT_IMAGES[product_num] || 'product_x.png';
}

// --------------- API helpers ---------------

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
}

// --------------- Init ---------------

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    setNavUser();

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('zeus_user');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('zeus_user');
            sessionStorage.removeItem('authToken');
            clearCart();
            window.location.href = '/login.html';
        });
    }
});
