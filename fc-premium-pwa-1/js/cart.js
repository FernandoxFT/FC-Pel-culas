// js/cart.js - Funciones del carrito de compras

function addToCart(movieId) {
    const pelicula = peliculas.find(p => p.id === movieId);
    if (!pelicula) return;

    if (pelicula.gratis) {
        if (!compras.includes(movieId)) compras.push(movieId);
        saveToLocalStorage();
        showNotification(`🎁 ${pelicula.titulo} desbloqueada gratis`, 'success');
        return;
    }

    carrito.push({...pelicula, cartId: Date.now()});
    updateCart();
    saveToLocalStorage();
    showNotification(`${pelicula.titulo} agregada al carrito`, 'success');
}

function removeFromCart(cartId) {
    carrito = carrito.filter(item => item.cartId !== cartId);
    updateCart();
    saveToLocalStorage();
}

function updateCart() {
    const count = carrito.length;
    document.getElementById('cart-count').textContent = count;
    renderCartItems();
}

function renderCartItems() {
    const cartList = document.getElementById('cart-items-list');
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    
    if (carrito.length === 0) {
        cartList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px 20px;">Tu carrito está vacío</p>';
        document.getElementById('cart-total').textContent = 'Gs. 0';
        return;
    }

    cartList.innerHTML = carrito.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                <div class="cart-item-price">Gs. ${item.precio.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.cartId})">×</button>
        </div>
    `).join('');

    document.getElementById('cart-total').textContent = `Gs. ${total.toLocaleString()}`;
}

function openCart() {
    document.getElementById('cart-sidebar').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('active');
}

document.getElementById('cart-toggle').addEventListener('click', openCart);
