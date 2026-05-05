/* ============================================
   cart.js — Cart page logic with checkout
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    const checkoutBtn = document.getElementById('checkoutBtn');
    const confirmBtn = document.getElementById('confirmPurchaseBtn');

    checkoutBtn.addEventListener('click', () => {
        openCheckoutModal();
    });

    confirmBtn.addEventListener('click', () => {
        confirmPurchase();
    });
});

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    const emptyEl = document.getElementById('emptyCart');
    const summaryCard = document.getElementById('summaryCard');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cart.length === 0) {
        container.innerHTML = '';
        emptyEl.style.display = 'block';
        summaryCard.style.display = 'none';
        checkoutBtn.disabled = true;
        return;
    }

    emptyEl.style.display = 'none';
    summaryCard.style.display = 'block';
    checkoutBtn.disabled = false;

    container.innerHTML = '';
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item d-flex align-items-center gap-3';
        div.innerHTML =
            '<img src="' + getProductImage(item.product_num) + '" alt="' + item.product_name + '" class="cart-item-img">' +
            '<div class="flex-grow-1">' +
            '<h6 class="mb-1 fw-bold">' + item.product_name + '</h6>' +
            '<div class="mt-1 fw-bold text-warning">' + formatCurrency(item.product_price) + '</div>' +
            '</div>' +
            '<div class="qty-control">' +
            '<button class="qty-btn" data-pnum="' + item.product_num + '" data-delta="-1">−</button>' +
            '<span class="qty-value">' + item.qty + '</span>' +
            '<button class="qty-btn" data-pnum="' + item.product_num + '" data-delta="1">+</button>' +
            '</div>' +
            '<div class="text-end ms-3" style="min-width:90px">' +
            '<div class="fw-bold">' + formatCurrency(item.product_price * item.qty) + '</div>' +
            '</div>' +
            '<button class="btn-remove" data-pnum="' + item.product_num + '" title="Remove"><i class="bi bi-trash3"></i></button>';
        container.appendChild(div);
    });

    // Qty buttons
    container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateCartQty(parseInt(btn.dataset.pnum), parseInt(btn.dataset.delta));
            renderCart();
        });
    });

    // Remove buttons
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(parseInt(btn.dataset.pnum));
            renderCart();
        });
    });

    // Update summary
    document.getElementById('subtotalDisplay').textContent = formatCurrency(getCartTotal());
    document.getElementById('itemCountDisplay').textContent = getCartItemCount();
    document.getElementById('totalDisplay').textContent = formatCurrency(getCartTotal());
}

function openCheckoutModal() {
    const cart = getCart();
    const listEl = document.getElementById('checkoutItemsList');
    listEl.innerHTML = '';
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checkout-item';
        div.innerHTML = '<span>' + item.product_name + ' x' + item.qty + '</span><span class="fw-bold">' + formatCurrency(item.product_price * item.qty) + '</span>';
        listEl.appendChild(div);
    });
    document.getElementById('checkoutTotal').textContent = formatCurrency(getCartTotal());

    // Reset state
    document.getElementById('checkoutReview').style.display = 'block';
    document.getElementById('checkoutSuccess').style.display = 'none';
    document.getElementById('checkoutFooter').style.display = 'flex';
    document.getElementById('checkoutSuccessFooter').style.display = 'none';

    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

async function confirmPurchase() {
    const user = getAuthUser();
    const cart = getCart();
    const confirmBtn = document.getElementById('confirmPurchaseBtn');

    if (!user) {
        alert('Please log in to complete your purchase.');
        window.location.href = '/login.html';
        return;
    }

    if (cart.length === 0) return;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        const result = await apiPost('/api/checkout', {
            uid: user.uid,
            items: cart.map(item => ({
                product_num: item.product_num,
                qty: item.qty,
                product_price: item.product_price
            }))
        });

        // Show success
        document.getElementById('checkoutReview').style.display = 'none';
        document.getElementById('checkoutSuccess').style.display = 'block';
        document.getElementById('checkoutFooter').style.display = 'none';
        document.getElementById('checkoutSuccessFooter').style.display = 'flex';
        document.getElementById('salesIdDisplay').textContent = result.sales_id || 'N/A';

        clearCart();
        renderCart();
    } catch (err) {
        alert('Checkout failed: ' + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-bag-check me-2"></i>Confirm Purchase';
    }
}
