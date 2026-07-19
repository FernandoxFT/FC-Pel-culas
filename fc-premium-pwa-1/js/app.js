// js/app.js - Inicialización de la aplicación y event listeners globales

// ===== INICIALIZAR APLICACIÓN =====
async function initApp() {
    // Bloquear scroll durante splash
    document.body.style.overflow = 'hidden';

    await loadMovies();
    loadFromLocalStorage();
    initBannerSlider();
    renderHomeSections();
    renderGenreSections();
    mostrarAvisoOfertas();
    renderCartItems();

    // Crear botones de filtro dinámicamente
    const generos = ['Acción', 'Ciencia Ficción', 'Drama', 'Thriller', 'Animación'];
    const filterContainer = document.getElementById('filter-genres');
    generos.forEach(genero => {
        const btn = document.createElement('button');
        btn.className = 'btn-filter';
        btn.dataset.genre = genero;
        btn.textContent = genero;
        btn.onclick = filterByGenre;
        filterContainer.appendChild(btn);
    });

    // Ocultar Splash Screen
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }, 3400);
}

// ===== CERRAR MODALES AL HACER CLICK FUERA =====
document.addEventListener('DOMContentLoaded', () => {
    const movieModal = document.getElementById('movie-modal');
    const loginModal = document.getElementById('login-modal');
    const cart = document.getElementById('cart-sidebar');
    const cartToggle = document.getElementById('cart-toggle');

    movieModal.addEventListener('click', (e) => {
        if (e.target.id === 'movie-modal') closeMovieModal();
    });

    loginModal.addEventListener('click', (e) => {
        if (e.target.id === 'login-modal') closeLoginModal();
    });

    const transferModal = document.getElementById('transfer-modal');
    transferModal.addEventListener('click', (e) => {
        if (e.target.id === 'transfer-modal') closeTransferModal();
    });

    const planesModal = document.getElementById('planes-modal');
    planesModal.addEventListener('click', (e) => {
        if (e.target.id === 'planes-modal') closePlanesModal();
    });

    document.getElementById('input-comprobante').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        comprobanteFile = file;
        const label = document.getElementById('comprobante-label');
        const preview = document.getElementById('comprobante-preview');

        label.textContent = `✅ ${file.name}`;
        label.classList.add('cargado');
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!cart.contains(e.target) && !cartToggle.contains(e.target) && cart.classList.contains('active')) {
            closeCart();
        }
    });

    // Ejecutar al cargar la página
    initApp();
});
