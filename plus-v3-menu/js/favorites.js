// js/favorites.js - Funciones de favoritos

function toggleFavorite(movieId) {
    const index = favoritos.findIndex(f => f == movieId || f.id == movieId);
    if (index > -1) {
        favoritos.splice(index, 1);
        showNotification('Eliminado de favoritos', 'info');
    } else {
        const movie = peliculas.find(p => p.id == movieId);
        if (movie) {
            favoritos.push(movieId);
            showNotification('Agregado a favoritos', 'success');
        }
    }
    updateFavoritesUI();
    saveToLocalStorage();
}

function updateFavoritesUI() {
    const countEl = document.getElementById('favorites-count');
    if (countEl) countEl.textContent = favoritos.length;
    
    // Actualizar botones en tarjetas
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const mId = btn.dataset.movieId;
        const isFav = favoritos.some(f => f == mId || f.id == mId);
        btn.classList.toggle('active', isFav);
        btn.innerHTML = isFav ? '❤️' : '🤍';
    });
}

// Event Listeners
const favToggle = document.getElementById('favorites-toggle');
if (favToggle) {
    favToggle.addEventListener('click', () => {
        if (typeof openFavoritesModal === 'function') {
            openFavoritesModal();
        } else if (favoritos.length === 0) {
            showNotification('No tienes películas en favoritos aún', 'info');
        } else {
            showNotification(`Tienes ${favoritos.length} favoritas guardadas`, 'success');
        }
    });
}
