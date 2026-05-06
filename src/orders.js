/* ============================================
   orders.js — Order history page logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('ordersLoader');
    const container = document.getElementById('ordersContainer');
    const noOrders = document.getElementById('noOrders');
    const user = getAuthUser();

    if (!user) {
        loader.style.display = 'none';
        noOrders.style.display = 'block';
        noOrders.innerHTML = '<i class="bi bi-person-x display-1 text-muted"></i>' +
            '<h4 class="text-muted mt-3">Please log in to view orders</h4>' +
            '<a href="/login.html" class="btn btn-primary mt-2"><i class="bi bi-box-arrow-in-right me-2"></i>Log In</a>';
        return;
    }

    try {
        const data = await apiGet('/api/orders?uid=' + user.uid);
        const orders = data.orders || [];

        loader.style.display = 'none';

        if (orders.length === 0) {
            noOrders.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            const date = order.purchase_date || 'N/A';
            const created = order.created_at ? new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

            card.innerHTML =
                '<div class="d-flex justify-content-between align-items-start mb-3">' +
                '<div><h6 class="fw-bold text-white mb-1">PO #' + order.poid + '</h6>' +
                '<small class="text-light opacity-75">' + created + '</small></div>' +
                '<span class="order-badge confirmed"><i class="bi bi-check-circle me-1"></i>Confirmed</span></div>' +
                '<div class="row">' +
                '<div class="col-sm-4"><small class="text-light opacity-75 d-block">Product</small>' +
                '<span class="fw-semibold text-white">' + (order.product_name || 'Product #' + order.po_product) + (order.si_quantity ? ' (x' + order.si_quantity + ')' : '') + '</span></div>' +
                '<div class="col-sm-3"><small class="text-light opacity-75 d-block">Price</small>' +
                '<span class="fw-semibold text-warning">' + formatCurrency(order.product_price || 0) + '</span></div>' +
                '<div class="col-sm-3"><small class="text-light opacity-75 d-block">Sales ID</small>' +
                '<span class="fw-semibold text-white">#' + (order.sales_id || 'N/A') + '</span></div>' +
                '<div class="col-sm-2"><small class="text-light opacity-75 d-block">Time</small>' +
                '<span class="fw-semibold text-white">' + date + '</span></div></div>';
            container.appendChild(card);
        });

    } catch (err) {
        loader.innerHTML = '<i class="bi bi-exclamation-triangle display-1 text-danger"></i>' +
            '<h4 class="text-danger mt-3">Failed to load orders</h4>' +
            '<p class="text-muted">' + err.message + '</p>' +
            '<button class="btn btn-outline-primary mt-2" onclick="location.reload()"><i class="bi bi-arrow-clockwise me-2"></i>Retry</button>';
    }
});
