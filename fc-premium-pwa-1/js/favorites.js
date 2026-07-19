// js/favorites.js - Funciones de favoritos

function toggleFavorite(movieId) {
    const index = favoritos.indexOf(movieId);
    if (index > -1) {
        favoritos.splice(index, 1);
    } else {
        favoritos.push(movieId);
    }
    updateFavoritesCount();
    updateMovieCards();
    saveToLocalStorage();
}

function updateFavoritesCount() {
    document.getElementById('favorites-count').textContent = favoritos.length;
}

function updateMovieCards() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const movieId = parseInt(btn.dataset.movieId);
        if (favoritos.includes(movieId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

document.getElementById('favorites-toggle').addEventListener('click', () => {
    showNotification(`Tienes ${favoritos.length} película(s) en favoritos`, 'info');
});
