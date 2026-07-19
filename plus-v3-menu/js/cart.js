// js/cart.js - Funciones del carrito de compras

function addToCart(movieId) {
    const pelicula = peliculas.find(p => p.id == movieId);
    if (!pelicula) return;

    // Verificar si ya está en el carrito
    if (carrito.some(item => item.id == movieId)) {
        showNotification(`${pelicula.titulo} ya está en el carrito`, 'info');
        openCart();
        return;
    }

    // Verificar si ya fue comprada
    if (compras.some(c => c.id == movieId || c.pelicula_id == movieId)) {
        showNotification(`Ya tienes ${pelicula.titulo}`, 'info');
        return;
    }

    if (pelicula.gratis) {
        showNotification(`🎁 ${pelicula.titulo} es gratis, ¡disfrútala!`, 'success');
        openMovieModal(movieId);
        return;
    }

    carrito.push({...pelicula, cartId: Date.now()});
    updateCart();
    saveToLocalStorage();
    showNotification(`${pelicula.titulo} agregada al carrito`, 'success');
    openCart();
}

function addToCartFromModal() {
    if (currentMovieId) {
        addToCart(currentMovieId);
    }
}

function removeFromCart(cartId) {
    carrito = carrito.filter(item => item.cartId !== cartId);
    updateCart();
    saveToLocalStorage();
}

function updateCart() {
    const count = carrito.length;
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = count;
    renderCartItems();
}

function renderCartItems() {
    const cartList = document.getElementById('cart-items-list');
    if (!cartList) return;

    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    
    if (carrito.length === 0) {
        cartList.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;">🛒</div>
                <p>Tu carrito está vacío</p>
                <button class="btn btn-secondary" onclick="closeCart()" style="margin-top: 20px; width: auto;">Explorar Películas</button>
            </div>
        `;
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.textContent = 'Gs. 0';
        return;
    }

    cartList.innerHTML = carrito.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                <div class="cart-item-price">Gs. ${item.precio.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.cartId})" aria-label="Eliminar">×</button>
        </div>
    `).join('');

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `Gs. ${total.toLocaleString()}`;
}

function openCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.add('active');
}

function closeCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

// Event Listeners
const cartToggle = document.getElementById('cart-toggle');
if (cartToggle) {
    cartToggle.addEventListener('click', openCart);
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('fc_carrito', JSON.stringify(carrito));
        localStorage.setItem('fc_favoritos', JSON.stringify(favoritos));
        localStorage.setItem('fc_compras', JSON.stringify(compras));
        if (userData) localStorage.setItem('fc_userData', JSON.stringify(userData));
    } catch (e) {
        console.error('Error guardando localStorage:', e);
    }
}
