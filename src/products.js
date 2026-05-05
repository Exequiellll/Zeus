/* ============================================
   products.js — Product listing page logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('productsGrid');
    const loader = document.getElementById('productsLoader');

    try {
        const data = await apiGet('/api/products');
        const products = data.products || [];
        loader.remove();

        if (products.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-box-seam display-1 text-muted"></i><h4 class="text-muted mt-3">No products available</h4></div>';
            return;
        }

        products.forEach((product, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-5';
            col.innerHTML = '<div class="card glass-card product-card h-100">' +
                '<div class="card-img-wrapper"><img src="' + getProductImage(product.product_num) + '" alt="' + product.product_name + '" loading="lazy"></div>' +
                '<div class="card-body d-flex flex-column">' +
                '<h5 class="product-name">' + product.product_name + '</h5>' +
                '<div class="mt-auto"><span class="product-price">' + formatCurrency(product.product_price) + '</span>' +
                '<button class="btn btn-add-cart" data-pid="' + product.pid + '" data-pnum="' + product.product_num + '" data-pname="' + product.product_name + '" data-pprice="' + product.product_price + '" id="addCartBtn_' + product.pid + '">' +
                '<i class="bi bi-cart-plus me-2"></i>Add to Cart</button></div></div></div>';
            grid.appendChild(col);
        });

        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = {
                    pid: parseInt(btn.dataset.pid),
                    product_num: parseInt(btn.dataset.pnum),
                    product_name: btn.dataset.pname,
                    product_price: parseInt(btn.dataset.pprice)
                };
                addToCart(product);
                showToast(product.product_name + ' added to cart!');
            });
        });
    } catch (err) {
        loader.innerHTML = '<div class="text-center py-5"><i class="bi bi-exclamation-triangle display-1 text-danger"></i><h4 class="text-danger mt-3">Failed to load products</h4><p class="text-muted">' + err.message + '</p><button class="btn btn-outline-primary mt-2" onclick="location.reload()"><i class="bi bi-arrow-clockwise me-2"></i>Retry</button></div>';
    }
});

function showToast(message) {
    const toastMsg = document.getElementById('toastMessage');
    const toastEl = document.getElementById('cartToast');
    if (toastMsg) toastMsg.textContent = message;
    if (toastEl) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2000 });
        toast.show();
    }
}
